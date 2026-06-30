import SavedPost from '../model/savedPost.model.js';
import mongoose from 'mongoose';

class SavedPostRepository {
    async findByUserAndPost(userId, postId) {
        return await SavedPost.findOne({ user: userId, post: postId });
    }

    async createSavedPost(data) {
        const savedPost = new SavedPost(data);
        return await savedPost.save();
    }

    async removeSavedPost(userId, postId) {
        return await SavedPost.findOneAndDelete({ user: userId, post: postId });
    }

    async removeSavedPosts(userId, postIds) {
        return await SavedPost.deleteMany({ user: userId, post: { $in: postIds } });
    }

    async moveSavedPosts(userId, postIds, collectionId) {
        return await SavedPost.updateMany(
            { user: userId, post: { $in: postIds } },
            { collection: collectionId }
        );
    }

    async moveCollectionPosts(userId, fromCollectionId, toCollectionId) {
        return await SavedPost.updateMany(
            { user: userId, collection: fromCollectionId },
            { collection: toCollectionId }
        );
    }

    async findPostIdsByCollection(userId, collectionId) {
        const rows = await SavedPost.find({ user: userId, collection: collectionId })
            .select('post -_id')
            .lean();
        return rows.map((row) => row.post.toString());
    }

    async removeCollectionPosts(userId, collectionId) {
        return await SavedPost.deleteMany({ user: userId, collection: collectionId });
    }

    async findPostIdsByUser(userId) {
        const rows = await SavedPost.find({ user: userId }).select('post -_id').lean();
        return rows.map((row) => row.post.toString());
    }

    async countByCollection(userId) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        return await SavedPost.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: '$collection', total: { $sum: 1 } } },
        ]);
    }

    async findSavedPostsByUser(userId, collectionId = null) {
        const filter = { user: userId };
        if (collectionId) {
            filter.collection = collectionId;
        }

        return await SavedPost.find(filter)
            .populate({
                path: 'post',
                match: { status: { $nin: ['hidden', 'deleted'] }, isAuthorActive: { $ne: false } },
                select: 'title content tags viewCount createdAt status author images',
                populate: {
                    path: 'author',
                    select: 'fullName avatar',
                },
            })
            .populate('collection', 'name isDefault')
            .sort({ createdAt: -1 })
            .lean();
    }
}

export default new SavedPostRepository();
