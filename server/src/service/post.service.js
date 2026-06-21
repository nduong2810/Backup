import postRepository from '../repository/post.repository.js';
import commentRepository from '../repository/comment.repository.js';
import Comment from '../model/comment.model.js';
import User from '../model/user.model.js';
import mongoose from 'mongoose';
import reputationService from './reputation.service.js';
import { uploadToCloudinary } from '../util/cloudinary.js';
import { slugify } from '../util/slugify.js';

const PUBLIC_POST_STATUS_FILTER = { $nin: ['hidden', 'deleted'] };

const mapStatusFilter = (status) => {
    return status.toLowerCase();
};

const VN_TZ_OFFSET_MIN = 7 * 60;

const getTodayStart = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnNow = new Date(utcMs + VN_TZ_OFFSET_MIN * 60000);
    const vnStart = new Date(vnNow);
    vnStart.setHours(0, 0, 0, 0);
    const vnStartUtcMs = vnStart.getTime() - VN_TZ_OFFSET_MIN * 60000;
    return new Date(vnStartUtcMs);
};

const includesUserId = (items = [], userId = '') => {
    if (!userId || !Array.isArray(items)) return false;
    return items.some((id) => String(id) === String(userId));
};

const getUserVote = (post, userId) => {
    if (!userId || !post) return null;
    if (includesUserId(post.upvotes, userId)) return 'upvote';
    if (includesUserId(post.downvotes, userId)) return 'downvote';
    return null;
};

const getUserReaction = (post, userId) => {
    if (!userId || !post) return null;
    if (includesUserId(post.likes, userId)) return 'like';
    if (includesUserId(post.dislikes, userId)) return 'dislike';
    return null;
};

class PostService {
    async getPosts(query, userId = null) {
        const {
            keyword = '',
            tags = '',
            status = 'All',
            sortBy = 'Newest',
            minViews = '',
            minUpvotes = '',
            author = '',
            authorId = '',
            postType = 'All',
            startDate = '',
            endDate = '',
            page = 1,
            limit = 15
        } = query;
        const filter = { status: PUBLIC_POST_STATUS_FILTER };

        if (keyword.trim()) {
            const regex = new RegExp(keyword.trim(), 'i');
            filter.$or = [{ title: regex }, { content: regex }];
        }

        if (tags.trim()) {
            const tagArray = tags.split(',').map((t) => slugify(t)).filter(Boolean);
            if (tagArray.length > 0) filter.tags = { $in: tagArray };
        }

        if (status && status !== 'All') filter.status = mapStatusFilter(status);
        if (minViews !== '' && !isNaN(Number(minViews))) filter.viewCount = { ...filter.viewCount, $gte: Number(minViews) };

        if (minUpvotes !== '' && !isNaN(Number(minUpvotes))) {
            filter.$expr = {
                $gte: [
                    { $cond: [{ $isArray: '$upvotes' }, { $size: { $ifNull: ['$upvotes', []] } }, { $ifNull: ['$upvotes', 0] }] },
                    Number(minUpvotes),
                ],
            };
        }

        if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
            filter.author = new mongoose.Types.ObjectId(authorId);
        } else if (author.trim()) {
            const users = await User.find({ fullName: new RegExp(author.trim(), 'i') }).select('_id');
            const userIds = users.map(u => u._id);
            filter.author = { $in: userIds };
        }

        if (postType && postType !== 'All') {
            filter.postType = postType;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            postRepository.findPostsForList(filter, sortBy, skip, limitNum),
            postRepository.countPosts(filter),
        ]);

        const normalizedPosts = posts.map((post) => ({
            ...post,
            status: post.status,
            views: post.viewCount ?? 0,
            upvotes: post.upvoteCount ?? 0,
            downvotes: post.downvoteCount ?? 0,
            upvoteCount: post.upvoteCount ?? 0,
            downvoteCount: post.downvoteCount ?? 0,
            likes: post.likeCount ?? 0,
            dislikes: post.dislikeCount ?? 0,
            likeCount: post.likeCount ?? 0,
            dislikeCount: post.dislikeCount ?? 0,
            userVote: getUserVote(post, userId),
            userReaction: getUserReaction(post, userId),
            answerCount: post.answerCount ?? 0,
        }));

        return {
            data: normalizedPosts,
            pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        };
    }

    async getPostDetail(postId, userId = null, incrementView = true) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
        if (post.status === 'hidden') throw { status: 403, message: 'Bài viết đang bị ẩn' };
        if (post.status === 'deleted') throw { status: 410, message: 'Bài viết đã bị xóa' };

        if (incrementView) {
            const todayStart = getTodayStart();
            const sameDay = post.dailyViewDate && post.dailyViewDate.getTime() === todayStart.getTime();
            await postRepository.incrementViewCount(postId, { resetDaily: !sameDay, todayStart });
        }

        const comments = await commentRepository.findByPostId(postId);
        const commentCount = await commentRepository.countByPostId(postId);

        return {
            post: {
                ...post.toObject(),
                viewCount: post.viewCount + (incrementView ? 1 : 0),
                userVote: getUserVote(post, userId),
                userReaction: getUserReaction(post, userId),
            },
            comments: this._buildCommentTree(comments),
            commentCount,
        };
    }

    async createComment(postId, userId, payload, files = {}) {
        const content = String(payload.content || '').trim();
        const parentComment = payload.parentComment || null;

        if (!content) throw { status: 400, message: 'Nội dung bình luận không được để trống' };
        if (content.length > 2000) throw { status: 400, message: 'Nội dung bình luận tối đa 2000 ký tự' };

        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
        if (post.status === 'resolved') throw { status: 423, message: 'Bài viết đang bị khóa' };
        if (post.status !== 'unresolved') throw { status: 400, message: 'Không thể bình luận trên bài viết này' };

        if (parentComment) {
            const parent = await commentRepository.findById(parentComment);
            if (!parent) throw { status: 404, message: 'Bình luận cha không tồn tại' };
            if (String(parent.post?._id || parent.post) !== String(postId)) throw { status: 400, message: 'Bình luận cha không thuộc bài viết này' };
        }

        let totalMediaSize = 0;

        if (files.images && files.images.length > 0) {
            for (const file of files.images) totalMediaSize += file.size / (1024 * 1024);
        } else if (payload.images && Array.isArray(payload.images)) {
            const base64Images = payload.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
            for (const img of base64Images) {
                const body = img.split(',')[1] || img;
                totalMediaSize += (body.length * 0.75) / (1024 * 1024);
            }
        }

        if (files.videos && files.videos.length > 0) {
            for (const file of files.videos) totalMediaSize += file.size / (1024 * 1024);
        } else if (payload.videos && Array.isArray(payload.videos)) {
            const base64Videos = payload.videos.filter(vid => typeof vid === 'string' && vid.startsWith('data:'));
            for (const vid of base64Videos) {
                const body = vid.split(',')[1] || vid;
                totalMediaSize += (body.length * 0.75) / (1024 * 1024);
            }
        } else if (payload.video && typeof payload.video === 'string' && payload.video.startsWith('data:')) {
            const body = payload.video.split(',')[1] || payload.video;
            totalMediaSize += (body.length * 0.75) / (1024 * 1024);
        }

        if (totalMediaSize > 50) {
            throw { status: 400, message: `Tổng dung lượng của tất cả hình ảnh và video đính kèm vượt quá giới hạn cho phép 50MB (Hiện tại: ${totalMediaSize.toFixed(2)}MB).` };
        }

        let imageUrls = [];
        let videoUrls = [];

        if (files.images && files.images.length > 0) {
            imageUrls = await Promise.all(files.images.map(img => uploadToCloudinary(img.buffer, img.mimetype)));
        } else if (payload.images && Array.isArray(payload.images)) {
            const base64Images = payload.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
            imageUrls = await Promise.all(base64Images.map(img => uploadToCloudinary(img)));
        }

        if (files.videos && files.videos.length > 0) {
            for (const vid of files.videos) {
                try {
                    const url = await uploadToCloudinary(vid.buffer, vid.mimetype);
                    videoUrls.push(url);
                } catch (uploadErr) {
                    console.error('[PostService] Comment Video upload failed:', uploadErr.message || uploadErr);
                    throw { status: 500, message: 'Upload video bình luận thất bại.' };
                }
            }
        } else if (payload.videos && Array.isArray(payload.videos)) {
            const base64Videos = payload.videos.filter(vid => typeof vid === 'string' && vid.startsWith('data:'));
            for (const vid of base64Videos) {
                const url = await uploadToCloudinary(vid);
                videoUrls.push(url);
            }
        } else if (payload.video && typeof payload.video === 'string' && payload.video.startsWith('data:')) {
            const url = await uploadToCloudinary(payload.video);
            videoUrls.push(url);
        }

        return await commentRepository.create({
            content,
            author: userId,
            post: postId,
            parentComment,
            images: imageUrls,
            videos: videoUrls
        });
    }

    async createPost(userId, payload, files = {}) {
        const title = String(payload.title || '').trim();
        const content = String(payload.content || '').trim();
        const postType = payload.postType || 'question';
        const tags = Array.isArray(payload.tags)
            ? payload.tags.map(t => slugify(t)).filter(Boolean)
            : [];

        if (!title) throw { status: 400, message: 'Tiêu đề không được để trống' };
        if (title.length > 200) throw { status: 400, message: 'Tiêu đề tối đa 200 ký tự' };
        if (!content) throw { status: 400, message: 'Nội dung không được để trống' };
        if (!['question', 'advice'].includes(postType)) throw { status: 400, message: 'Loại bài viết không hợp lệ' };

        let totalMediaSize = 0;

        if (files.images && files.images.length > 0) {
            for (const file of files.images) totalMediaSize += file.size / (1024 * 1024);
        } else if (payload.images && Array.isArray(payload.images)) {
            const base64Images = payload.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
            for (const img of base64Images) {
                const body = img.split(',')[1] || img;
                totalMediaSize += (body.length * 0.75) / (1024 * 1024);
            }
        }

        if (files.videos && files.videos.length > 0) {
            for (const file of files.videos) totalMediaSize += file.size / (1024 * 1024);
        } else if (payload.videos && Array.isArray(payload.videos)) {
            const base64Videos = payload.videos.filter(vid => typeof vid === 'string' && vid.startsWith('data:'));
            for (const vid of base64Videos) {
                const body = vid.split(',')[1] || vid;
                totalMediaSize += (body.length * 0.75) / (1024 * 1024);
            }
        } else if (payload.video && typeof payload.video === 'string' && payload.video.startsWith('data:')) {
            const body = payload.video.split(',')[1] || payload.video;
            totalMediaSize += (body.length * 0.75) / (1024 * 1024);
        }

        if (totalMediaSize > 50) {
            throw { status: 400, message: `Tổng dung lượng của tất cả hình ảnh và video đính kèm vượt quá giới hạn cho phép 50MB (Hiện tại: ${totalMediaSize.toFixed(2)}MB).` };
        }

        let imageUrls = [];
        let videoUrls = [];

        if (files.images && files.images.length > 0) {
            imageUrls = await Promise.all(files.images.map(img => uploadToCloudinary(img.buffer, img.mimetype)));
        } else if (payload.images && Array.isArray(payload.images)) {
            const base64Images = payload.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
            imageUrls = await Promise.all(base64Images.map(img => uploadToCloudinary(img)));
        }

        if (files.videos && files.videos.length > 0) {
            for (const vid of files.videos) {
                try {
                    const url = await uploadToCloudinary(vid.buffer, vid.mimetype);
                    videoUrls.push(url);
                } catch (uploadErr) {
                    console.error('[PostService] Video upload failed:', uploadErr.message || uploadErr);
                    throw { status: 500, message: 'Upload video thất bại. Vui lòng thử lại hoặc chọn video nhỏ hơn.' };
                }
            }
        } else if (payload.videos && Array.isArray(payload.videos)) {
            const base64Videos = payload.videos.filter(vid => typeof vid === 'string' && vid.startsWith('data:'));
            for (const vid of base64Videos) {
                const url = await uploadToCloudinary(vid);
                videoUrls.push(url);
            }
        } else if (payload.video && typeof payload.video === 'string' && payload.video.startsWith('data:')) {
            const url = await uploadToCloudinary(payload.video);
            videoUrls.push(url);
        }

        const post = await postRepository.create({
            title,
            content,
            postType,
            tags,
            images: imageUrls,
            videos: videoUrls,
            author: userId,
            status: 'unresolved'
        });

        return await postRepository.findById(post._id);
    }

    async toggleVote(postId, userId, voteType) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
        if (post.status === 'resolved') throw { status: 423, message: 'Bài viết đang bị khóa' };
        if (post.status !== 'unresolved') throw { status: 400, message: 'Không thể vote bài viết này' };

        const authorId = post.author?._id?.toString() || post.author?.toString();
        const isSelfVote = authorId && authorId === userId;
        if (isSelfVote) {
            throw { status: 400, message: 'Bạn không thể tự bình chọn cho bài viết của chính mình.' };
        }

        const hasUpvoted = includesUserId(post.upvotes, userId);
        const hasDownvoted = includesUserId(post.downvotes, userId);
        let userVote = null;
        const todayStart = getTodayStart();
        const dailyUpdates = {};
        const applyDailyUpdate = (countField, dateField, delta, currentDate, currentCount) => {
            if (!delta) return;
            const sameDay = currentDate && currentDate.getTime() === todayStart.getTime();
            if (sameDay) {
                dailyUpdates[countField] = Math.max(0, (currentCount ?? 0) + delta);
                dailyUpdates[dateField] = todayStart;
                return;
            }
            if (delta > 0) {
                dailyUpdates[countField] = 1;
                dailyUpdates[dateField] = todayStart;
            }
        };



        if (voteType === 'upvote') {
            if (hasUpvoted) {
                await postRepository.removeUpvote(postId, userId);
                applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', -1, post.dailyUpvoteDate, post.dailyUpvoteCount);

                // Rút upvote → trừ điểm tác giả
                if (!isSelfVote) await reputationService.award(authorId, 'post_upvote_removed', postId, userId);
            } else {
                if (hasDownvoted) {
                    await postRepository.removeDownvote(postId, userId);
                    applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', -1, post.dailyDownvoteDate, post.dailyDownvoteCount);
                    // Rút downvote → hoàn điểm tác giả và voter
                    if (!isSelfVote) await reputationService.award(authorId, 'post_downvote_removed', postId, userId);
                    await reputationService.award(userId, 'downvote_given_removed', postId, userId);
                }
                await postRepository.addUpvote(postId, userId);
                userVote = 'upvote';
                applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', 1, post.dailyUpvoteDate, post.dailyUpvoteCount);
                // Upvote mới → cộng điểm tác giả
                if (!isSelfVote) await reputationService.award(authorId, 'post_upvoted', postId, userId);
                if (!isSelfVote) await reputationService.award(authorId, 'post_upvoted');
            }
        } else if (voteType === 'downvote') {
            if (hasDownvoted) {
                await postRepository.removeDownvote(postId, userId);
                applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', -1, post.dailyDownvoteDate, post.dailyDownvoteCount);
                // Rút downvote → hoàn điểm tác giả và voter
                if (!isSelfVote) await reputationService.award(authorId, 'post_downvote_removed', postId, userId);
                await reputationService.award(userId, 'downvote_given_removed', postId, userId);
                if (!isSelfVote) await reputationService.award(authorId, 'post_downvote_removed');
                await reputationService.award(userId, 'downvote_given_removed');
            } else {
                if (hasUpvoted) {
                    await postRepository.removeUpvote(postId, userId);
                    applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', -1, post.dailyUpvoteDate, post.dailyUpvoteCount);
                    // Rút upvote (do chuyển sang downvote) → trừ điểm tác giả
                    if (!isSelfVote) await reputationService.award(authorId, 'post_upvote_removed', postId, userId);
                    if (!isSelfVote) await reputationService.award(authorId, 'post_upvote_removed');
                }
                await postRepository.addDownvote(postId, userId);
                userVote = 'downvote';
                applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', 1, post.dailyDownvoteDate, post.dailyDownvoteCount);
                // Downvote mới → trừ điểm tác giả + trừ điểm voter
                if (!isSelfVote) await reputationService.award(authorId, 'post_downvoted', postId, userId);
                await reputationService.award(userId, 'downvote_given', postId, userId);
                if (!isSelfVote) await reputationService.award(authorId, 'post_downvoted');
                await reputationService.award(userId, 'downvote_given');
            }
        }

        if (Object.keys(dailyUpdates).length > 0) await postRepository.updateDailyVoteStats(postId, dailyUpdates);
        const updatedPost = await postRepository.findById(postId);
        return { postId: updatedPost._id, upvoteCount: updatedPost.upvotes.length, downvoteCount: updatedPost.downvotes.length, userVote };
    }

    async toggleReaction(postId, userId, reactionType) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
        if (post.status === 'resolved') throw { status: 423, message: 'Bài viết đang bị khóa' };
        if (post.status !== 'unresolved') throw { status: 400, message: 'Không thể like/dislike bài viết này' };

        const authorId = post.author?._id?.toString() || post.author?.toString();
        const isSelfReaction = authorId && authorId === userId;
        if (isSelfReaction) {
            throw { status: 400, message: 'Bạn không thể tự bày tỏ cảm xúc trên bài viết của chính mình.' };
        }

        const hasLiked = includesUserId(post.likes, userId);
        const hasDisliked = includesUserId(post.dislikes, userId);
        let userReaction = null;

        if (reactionType === 'like') {
            if (hasLiked) await postRepository.removeLike(postId, userId);
            else {
                await postRepository.addLike(postId, userId);
                userReaction = 'like';
            }
        } else if (reactionType === 'dislike') {
            if (hasDisliked) await postRepository.removeDislike(postId, userId);
            else {
                await postRepository.addDislike(postId, userId);
                userReaction = 'dislike';
            }
        }

        const updatedPost = await postRepository.findById(postId);
        return {
            postId: updatedPost._id,
            likeCount: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0,
            dislikeCount: Array.isArray(updatedPost.dislikes) ? updatedPost.dislikes.length : 0,
            userReaction,
        };
    }

    async getRelatedPosts(tag, excludePostId) {
        if (!tag || tag.trim() === '') throw { status: 400, message: 'Tag không được để trống' };
        return await postRepository.findRelatedByTag(slugify(tag), excludePostId, 5);
    }

    async getPostDetailSidebarData() {
        const [hotQuestions, popularTags] = await Promise.all([
            postRepository.findHotNetworkQuestions(10),
            postRepository.findPopularTags(5),
        ]);
        return { hotQuestions: hotQuestions.map((item) => ({ id: item._id, title: item.title })), popularTags };
    }

    async getTrendingToday(query = {}) {
        const limitNum = Math.min(20, Math.max(1, parseInt(query.limit, 10) || 10));
        const todayStart = getTodayStart();
        const posts = await postRepository.findTrendingToday(todayStart, limitNum);
        return posts.map((post) => ({ ...post, viewsToday: post.dailyViewCount ?? 0, views: post.viewCount ?? 0 }));
    }

    async getTopUpvoted(query = {}) {
        const limitNum = Math.min(20, Math.max(1, parseInt(query.limit, 10) || 10));
        const todayStart = getTodayStart();
        const posts = await postRepository.findTopUpvoted(todayStart, limitNum);
        return posts.map((post) => ({ ...post, upvotesToday: post.dailyUpvoteCount ?? 0, upvoteCount: post.upvoteCount ?? 0, downvoteCount: post.downvoteCount ?? 0, views: post.viewCount ?? 0 }));
    }

    _buildCommentTree(comments) {
        const commentMap = {};
        const rootComments = [];
        comments.forEach(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = [];
            commentMap[commentObj._id.toString()] = commentObj;
        });
        comments.forEach(comment => {
            const commentObj = commentMap[comment._id.toString()];
            if (comment.parentComment) {
                const parentId = comment.parentComment.toString();
                if (commentMap[parentId]) commentMap[parentId].replies.push(commentObj);
            } else {
                rootComments.push(commentObj);
            }
        });
        return rootComments;
    }

    async softDeletePost(postId, userId) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };

        if (String(post.author?._id || post.author) !== String(userId)) {
            throw { status: 403, message: 'Bạn không có quyền xóa bài viết này' };
        }

        return await postRepository.softDelete(postId, 'owner');
    }

    async restorePost(postId, userId) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };

        if (String(post.author?._id || post.author) !== String(userId)) {
            throw { status: 403, message: 'Bạn không có quyền khôi phục bài viết này' };
        }

        if (post.status !== 'deleted') {
            throw { status: 400, message: 'Bài viết không nằm trong thùng rác' };
        }

        if (post.deletedBy && post.deletedBy !== 'owner') {
            throw { status: 403, message: 'Bài viết bị ẩn/xóa do vi phạm chính sách cộng đồng hoặc do admin ẩn, bạn không thể tự khôi phục.' };
        }

        return await postRepository.restore(postId);
    }

    async permanentlyDeletePost(postId, userId) {
        const post = await postRepository.findById(postId);
        if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };

        if (String(post.author?._id || post.author) !== String(userId)) {
            throw { status: 403, message: 'Bạn không có quyền xóa vĩnh viễn bài viết này' };
        }

        await postRepository.permanentlyDelete(postId);
        await Comment.deleteMany({ post: postId });
        return { success: true, message: 'Xóa vĩnh viễn bài viết thành công' };
    }

    async getTrashPosts(userId) {
        return await postRepository.findDeletedPostsByAuthor(userId);
    }

    async deleteComment(commentId, userId) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) throw { status: 404, message: 'Bình luận không tồn tại' };

        if (String(comment.author?._id || comment.author) !== String(userId)) {
            throw { status: 403, message: 'Bạn không có quyền xóa bình luận này' };
        }

        const deleteCommentAndReplies = async (id) => {
            const replies = await Comment.find({ parentComment: id });
            for (const reply of replies) {
                await deleteCommentAndReplies(reply._id);
            }
            await Comment.findByIdAndDelete(id);
        };

        await deleteCommentAndReplies(commentId);
        return { success: true, message: 'Xóa bình luận thành công' };
    }
}

export default new PostService();
