import mongoose from 'mongoose';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';

// ====================================================================
// STATISTICS REPOSITORY - Tầng Data Access cho thống kê hoạt động user
// ====================================================================

class StatisticsRepository {

    /**
     * Thống kê bài viết: tổng, phân theo postType và status
     */
    async getPostStats(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [total, byType, byStatus, totalViews, totalUpvotes, totalDownvotes] = await Promise.all([
            Post.countDocuments({ author: objectId }),
            Post.aggregate([
                { $match: { author: objectId } },
                { $group: { _id: '$postType', count: { $sum: 1 } } },
            ]),
            Post.aggregate([
                { $match: { author: objectId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Post.aggregate([
                { $match: { author: objectId } },
                { $group: { _id: null, total: { $sum: '$viewCount' } } },
            ]),
            Post.aggregate([
                { $match: { author: objectId } },
                {
                    $project: {
                        count: {
                            $cond: [{ $isArray: '$upvotes' }, { $size: '$upvotes' }, 0],
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: '$count' } } },
            ]),
            Post.aggregate([
                { $match: { author: objectId } },
                {
                    $project: {
                        count: {
                            $cond: [{ $isArray: '$downvotes' }, { $size: '$downvotes' }, 0],
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: '$count' } } },
            ]),
        ]);

        return {
            total,
            byType: byType.reduce((acc, item) => {
                acc[item._id || 'question'] = item.count;
                return acc;
            }, {}),
            byStatus: byStatus.reduce((acc, item) => {
                acc[item._id || 'active'] = item.count;
                return acc;
            }, {}),
            totalViews: totalViews[0]?.total || 0,
            totalUpvotes: totalUpvotes[0]?.total || 0,
            totalDownvotes: totalDownvotes[0]?.total || 0,
        };
    }

    /**
     * Thống kê bình luận: tổng, tổng likes nhận được
     */
    async getCommentStats(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [total, totalLikes] = await Promise.all([
            Comment.countDocuments({ author: objectId }),
            Comment.aggregate([
                { $match: { author: objectId } },
                {
                    $project: {
                        count: {
                            $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0],
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: '$count' } } },
            ]),
        ]);

        return {
            total,
            totalLikes: totalLikes[0]?.total || 0,
        };
    }

    /**
     * Timeline bài viết theo tháng (mặc định 12 tháng gần nhất)
     */
    async getPostTimeline(userId, months = 12) {
        const objectId = new mongoose.Types.ObjectId(userId);
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        startDate.setDate(1);
        const vnTime = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
        const vnStartUtc = Date.UTC(vnTime.getUTCFullYear(), vnTime.getUTCMonth(), vnTime.getUTCDate(), 0, 0, 0, 0);
        startDate.setTime(vnStartUtc - 7 * 60 * 60 * 1000);

        return await Post.aggregate([
            {
                $match: {
                    author: objectId,
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    count: 1,
                },
            },
        ]);
    }

    /**
     * Timeline bình luận theo tháng
     */
    async getCommentTimeline(userId, months = 12) {
        const objectId = new mongoose.Types.ObjectId(userId);
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        startDate.setDate(1);
        const vnTime2 = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
        const vnStartUtc2 = Date.UTC(vnTime2.getUTCFullYear(), vnTime2.getUTCMonth(), vnTime2.getUTCDate(), 0, 0, 0, 0);
        startDate.setTime(vnStartUtc2 - 7 * 60 * 60 * 1000);

        return await Comment.aggregate([
            {
                $match: {
                    author: objectId,
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    count: 1,
                },
            },
        ]);
    }

    /**
     * Top tags thường dùng nhất
     */
    async getTopTags(userId, limit = 10) {
        const objectId = new mongoose.Types.ObjectId(userId);

        return await Post.aggregate([
            { $match: { author: objectId, tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            { $match: { tags: { $type: 'string', $ne: '' } } },
            { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: limit },
            { $project: { _id: 0, name: '$_id', count: 1 } },
        ]);
    }

    /**
     * Top bài viết nhiều upvote nhất
     */
    async getTopPosts(userId, limit = 5) {
        const objectId = new mongoose.Types.ObjectId(userId);

        return await Post.aggregate([
            { $match: { author: objectId, status: { $ne: 'deleted' } } },
            {
                $addFields: {
                    upvoteCount: {
                        $cond: [{ $isArray: '$upvotes' }, { $size: '$upvotes' }, 0],
                    },
                    downvoteCount: {
                        $cond: [{ $isArray: '$downvotes' }, { $size: '$downvotes' }, 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { postId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$post', '$$postId'] } } },
                        { $count: 'count' },
                    ],
                    as: 'commentMeta',
                },
            },
            {
                $addFields: {
                    commentCount: { $ifNull: [{ $arrayElemAt: ['$commentMeta.count', 0] }, 0] },
                },
            },
            { $sort: { upvoteCount: -1, viewCount: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    postType: 1,
                    viewCount: 1,
                    upvoteCount: 1,
                    downvoteCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    tags: 1,
                },
            },
        ]);
    }

    /**
     * Danh sách bài viết gần đây của user (cho section Bài viết kiểu StackOverflow)
     */
    async getRecentPosts(userId, limit = 10) {
        const objectId = new mongoose.Types.ObjectId(userId);

        return await Post.aggregate([
            { $match: { author: objectId, status: { $ne: 'deleted' } } },
            {
                $addFields: {
                    upvoteCount: {
                        $cond: [{ $isArray: '$upvotes' }, { $size: '$upvotes' }, 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { postId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$post', '$$postId'] } } },
                        { $count: 'count' },
                    ],
                    as: 'commentMeta',
                },
            },
            {
                $addFields: {
                    commentCount: { $ifNull: [{ $arrayElemAt: ['$commentMeta.count', 0] }, 0] },
                },
            },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    postType: 1,
                    status: 1,
                    viewCount: 1,
                    upvoteCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    tags: 1,
                },
            },
        ]);
    }

    /**
     * Danh sách bình luận gần đây của user (cho section Bình luận kiểu StackOverflow)
     */
    async getRecentComments(userId, limit = 10) {
        const objectId = new mongoose.Types.ObjectId(userId);

        return await Comment.aggregate([
            { $match: { author: objectId } },
            {
                $addFields: {
                    likeCount: {
                        $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'postInfo',
                },
            },
            { $unwind: { path: '$postInfo', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    likeCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    postId: '$post',
                    postTitle: '$postInfo.title',
                },
            },
        ]);
    }

    /**
     * Thống kê votes user đã cast cho bài viết khác
     */
    async getVotesGiven(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [upvoted, downvoted] = await Promise.all([
            Post.countDocuments({ upvotes: objectId }),
            Post.countDocuments({ downvotes: objectId }),
        ]);

        return { upvoted, downvoted, total: upvoted + downvoted };
    }

    /**
     * Lịch sử thay đổi reputation (upvotes, downvotes nhận trên bài viết, và donations nhận)
     */
    async getReputationChanges(userId, limit = 10) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const logs = await ReputationHistory.find({ user: objectId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return logs.map(log => ({
            _id: log.targetId ? `${log.targetId.toString()}_${log.type}` : `${log._id.toString()}_reputation`,
            title: log.title,
            type: log.type,
            reputationEarned: log.reputationEarned,
            createdAt: log.createdAt,
        }));
    }

    /**
     * Thống kê donation nhận được và đã gửi
     */
    async getDonationStats(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [received, sent] = await Promise.all([
            DonationTransaction.aggregate([
                { $match: { author: objectId, status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),
            DonationTransaction.aggregate([
                { $match: { donor: objectId, status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        return {
            received: {
                totalAmount: received[0]?.totalAmount || 0,
                count: received[0]?.count || 0,
            },
            sent: {
                totalAmount: sent[0]?.totalAmount || 0,
                count: sent[0]?.count || 0,
            },
        };
    }
}

export default new StatisticsRepository();
