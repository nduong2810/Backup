import postRepository from '../repository/post.repository.js';
import savedCollectionRepository from '../repository/savedCollection.repository.js';
import savedPostRepository from '../repository/savedPost.repository.js';
import { getRedisClient } from '../config/redis.js';
import env from '../config/environment.js';

const DEFAULT_COLLECTION_NAME = 'Lưu trữ';
const SAVED_IDS_TTL_SECONDS = Number(env.REDIS_SAVED_TTL || 3600);

const buildSavedIdsCacheKey = (userId) => `saved:ids:${userId}`;

class SavedService {
    async ensureDefaultCollection(userId) {
        const existing = await savedCollectionRepository.findDefaultByUser(userId);
        if (existing) return existing;

        return await savedCollectionRepository.createCollection({
            user: userId,
            name: DEFAULT_COLLECTION_NAME,
            isDefault: true,
        });
    }

    async getCollections(userId) {
        await this.ensureDefaultCollection(userId);
        const collections = await savedCollectionRepository.findByUser(userId);
        const counts = await savedPostRepository.countByCollection(userId);
        const countMap = new Map(counts.map((item) => [item._id.toString(), item.total]));

        return collections.map((collection) => ({
            ...collection,
            total: countMap.get(collection._id.toString()) || 0,
        }));
    }

    async createCollection(userId, name) {
        await this.ensureDefaultCollection(userId);
        return await savedCollectionRepository.createCollection({
            user: userId,
            name,
        });
    }

    async renameCollection(userId, collectionId, name) {
        const collection = await this._getCollectionForUser(userId, collectionId);
        if (collection.isDefault) {
            throw new Error('Khong the doi ten thu muc mac dinh');
        }
        return await savedCollectionRepository.updateCollection(collectionId, { name });
    }

    async deleteCollection(userId, collectionId) {
        const collection = await this._getCollectionForUser(userId, collectionId);
        if (collection.isDefault) {
            throw new Error('Khong the xoa thu muc mac dinh');
        }

        const postIds = await savedPostRepository.findPostIdsByCollection(userId, collectionId);
        await savedPostRepository.removeCollectionPosts(userId, collectionId);
        await savedCollectionRepository.deleteCollection(collectionId);
        this._updateSavedIdsCache(userId, postIds, false).catch(() => {});

        return { deletedCollectionId: collectionId, removedCount: postIds.length };
    }

    async savePost(userId, postId, collectionId = null) {
        const post = await postRepository.findById(postId);
        if (!post) {
            throw new Error('Bai viet khong ton tai');
        }
        if (post.status === 'hidden') {
            throw new Error('Bai viet dang bi an');
        }
        if (post.status === 'deleted') {
            throw new Error('Bai viet da bi xoa');
        }

        const targetCollection = collectionId
            ? await this._getCollectionForUser(userId, collectionId)
            : await this.ensureDefaultCollection(userId);

        const existing = await savedPostRepository.findByUserAndPost(userId, postId);
        if (existing) {
            if (existing.collection.toString() !== targetCollection._id.toString()) {
                await savedPostRepository.moveSavedPosts(userId, [postId], targetCollection._id);
            }
            this._updateSavedIdsCache(userId, postId, true).catch(() => {});
            return { saved: true, collectionId: targetCollection._id };
        }

        await savedPostRepository.createSavedPost({
            user: userId,
            post: postId,
            collection: targetCollection._id,
        });

        this._updateSavedIdsCache(userId, postId, true).catch(() => {});
        return { saved: true, collectionId: targetCollection._id };
    }

    async removeSavedPost(userId, postId) {
        const removed = await savedPostRepository.removeSavedPost(userId, postId);
        this._updateSavedIdsCache(userId, postId, false).catch(() => {});

        return { removed: Boolean(removed) };
    }

    async removeSavedPosts(userId, postIds) {
        await savedPostRepository.removeSavedPosts(userId, postIds);
        this._updateSavedIdsCache(userId, postIds, false).catch(() => {});

        return { removedCount: postIds.length };
    }

    async moveSavedPosts(userId, postIds, toCollectionId) {
        await this._getCollectionForUser(userId, toCollectionId);
        await savedPostRepository.moveSavedPosts(userId, postIds, toCollectionId);

        return { movedCount: postIds.length };
    }

    async getSavedPosts(userId, collectionId = null) {
        if (collectionId) {
            await this._getCollectionForUser(userId, collectionId);
        }

        const savedPosts = await savedPostRepository.findSavedPostsByUser(userId, collectionId);
        return savedPosts
            .filter((item) => item.post !== null && item.post !== undefined)
            .map((item) => ({
                id: item._id,
                collection: item.collection,
                post: item.post,
                savedAt: item.createdAt,
            }));
    }

    async getSavedPostIds(userId) {
        const client = await getRedisClient();
        const cacheKey = buildSavedIdsCacheKey(userId);

        if (client) {
            try {
                const cached = await client.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            } catch {
                // Redis unavailable at runtime -> fallback to DB
            }
        }

        const ids = await savedPostRepository.findPostIdsByUser(userId);

        if (client) {
            try {
                await client.set(cacheKey, JSON.stringify(ids), { EX: SAVED_IDS_TTL_SECONDS });
            } catch {
                // Ignore cache write failure
            }
        }

        return ids;
    }

    async _getCollectionForUser(userId, collectionId) {
        const collection = await savedCollectionRepository.findById(collectionId);
        if (!collection || collection.user.toString() !== userId) {
            throw new Error('Thu muc khong ton tai');
        }
        return collection;
    }

    async _updateSavedIdsCache(userId, postIdOrIds, isAdd) {
        const client = await getRedisClient();
        if (!client) return;

        const cacheKey = buildSavedIdsCacheKey(userId);
        let cached = null;
        try {
            cached = await client.get(cacheKey);
        } catch {
            return;
        }
        if (!cached) return;

        const ids = new Set(JSON.parse(cached));
        const targetIds = Array.isArray(postIdOrIds) ? postIdOrIds : [postIdOrIds];

        targetIds.forEach((id) => {
            if (isAdd) ids.add(String(id));
            else ids.delete(String(id));
        });

        try {
            await client.set(cacheKey, JSON.stringify([...ids]), { EX: SAVED_IDS_TTL_SECONDS });
        } catch {
            // Ignore cache update failure
        }
    }
}

export default new SavedService();
