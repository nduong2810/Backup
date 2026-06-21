import mongoose from 'mongoose';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';

const getDateFilter = (timeRange) => {
    if (!timeRange || timeRange === 'all') return null;
    const now = new Date();
    if (timeRange === '7days') {
        return new Date(now.setDate(now.getDate() - 7));
    }
    if (timeRange === '30days') {
        return new Date(now.setDate(now.getDate() - 30));
    }
    if (timeRange === '12months') {
        return new Date(now.setMonth(now.getMonth() - 12));
    }
    return null;
};


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
    async getRecentPosts(userId, limit = 10, skip = 0, sortBy = 'newest', timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);

        let sortStage = { createdAt: -1 };
        if (sortBy === 'score') {
            sortStage = { upvoteCount: -1, createdAt: -1 };
        } else if (sortBy === 'views') {
            sortStage = { viewCount: -1, createdAt: -1 };
        }

        const matchStage = { author: objectId, status: { $ne: 'deleted' } };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            matchStage.createdAt = { $gte: dateLimit };
        }

        const pipeline = [
            { $match: matchStage },
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
            { $sort: sortStage },
        ];

        if (skip > 0) {
            pipeline.push({ $skip: skip });
        }
        pipeline.push({ $limit: limit });
        pipeline.push({
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
        });

        return await Post.aggregate(pipeline);
    }

    async countUserPosts(userId, timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);
        const query = { author: objectId, status: { $ne: 'deleted' } };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            query.createdAt = { $gte: dateLimit };
        }
        return await Post.countDocuments(query);
    }


    async getRecentComments(userId, limit = 10, skip = 0, sortBy = 'newest', timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);

        let sortStage = { createdAt: -1 };
        if (sortBy === 'score') {
            sortStage = { likeCount: -1, createdAt: -1 };
        } else if (sortBy === 'views') {
            sortStage = { 'postInfo.viewCount': -1, createdAt: -1 };
        }

        const matchStage = { author: objectId };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            matchStage.createdAt = { $gte: dateLimit };
        }

        const pipeline = [
            { $match: matchStage },
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
            { $sort: sortStage },
        ];

        if (skip > 0) {
            pipeline.push({ $skip: skip });
        }
        pipeline.push({ $limit: limit });
        pipeline.push({
            $project: {
                _id: 1,
                content: 1,
                likeCount: 1,
                createdAt: 1,
                updatedAt: 1,
                postId: '$post',
                postTitle: '$postInfo.title',
                postViewCount: '$postInfo.viewCount',
            },
        });

        return await Comment.aggregate(pipeline);
    }

    async countUserComments(userId, timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);
        const query = { author: objectId };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            query.createdAt = { $gte: dateLimit };
        }
        return await Comment.countDocuments(query);
    }


    async getVotesGiven(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [upvoted, downvoted] = await Promise.all([
            Post.countDocuments({ upvotes: objectId }),
            Post.countDocuments({ downvotes: objectId }),
        ]);

        return { upvoted, downvoted, total: upvoted + downvoted };
    }

    /**
     * Thống kê reactions user đã cast cho bài viết và bình luận khác
     */
    async getReactionsGiven(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const [likedPosts, dislikedPosts, likedComments, dislikedComments] = await Promise.all([
            Post.countDocuments({ likes: objectId }),
            Post.countDocuments({ dislikes: objectId }),
            Comment.countDocuments({ likes: objectId }),
            Comment.countDocuments({ dislikes: objectId }),
        ]);

        const liked = likedPosts + likedComments;
        const disliked = dislikedPosts + dislikedComments;

        return { liked, disliked, total: liked + disliked };
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

    async getReputationChangesPaginated(userId, limit = 10, skip = 0) {
        const objectId = new mongoose.Types.ObjectId(userId);

        const logs = await ReputationHistory.find({ user: objectId })
            .sort({ createdAt: -1 })
            .skip(skip)
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

    async countReputationChanges(userId) {
        const objectId = new mongoose.Types.ObjectId(userId);
        return await ReputationHistory.countDocuments({ user: objectId });
    }

    async getRecentVotes(userId, limit = 10, skip = 0, sortBy = 'newest', timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);

        const matchStage = {
            $or: [
                { upvotes: objectId },
                { downvotes: objectId },
                { likes: objectId },
                { dislikes: objectId }
            ],
            status: 'active'
        };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            matchStage.createdAt = { $gte: dateLimit };
        }

        const pipeline = [
            {
                $match: matchStage
            }
        ];

        // Sort
        if (sortBy === 'score') {
            pipeline.push({
                $addFields: {
                    score: {
                        $subtract: [
                            { $cond: [{ $isArray: '$upvotes' }, { $size: '$upvotes' }, 0] },
                            { $cond: [{ $isArray: '$downvotes' }, { $size: '$downvotes' }, 0] }
                        ]
                    }
                }
            });
            pipeline.push({ $sort: { score: -1, createdAt: -1 } });
        } else if (sortBy === 'views') {
            pipeline.push({ $sort: { viewCount: -1, createdAt: -1 } });
        } else {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        // Pagination
        if (skip > 0) {
            pipeline.push({ $skip: skip });
        }
        pipeline.push({ $limit: limit });

        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                postType: 1,
                upvotes: 1,
                downvotes: 1,
                likes: 1,
                dislikes: 1,
                viewCount: 1,
                createdAt: 1,
            }
        });

        const posts = await Post.aggregate(pipeline);

        return posts.map(post => {
            let userAction = '';
            if (Array.isArray(post.upvotes) && post.upvotes.map(id => id.toString()).includes(userId)) {
                userAction = 'upvote';
            } else if (Array.isArray(post.downvotes) && post.downvotes.map(id => id.toString()).includes(userId)) {
                userAction = 'downvote';
            } else if (Array.isArray(post.likes) && post.likes.map(id => id.toString()).includes(userId)) {
                userAction = 'like';
            } else if (Array.isArray(post.dislikes) && post.dislikes.map(id => id.toString()).includes(userId)) {
                userAction = 'dislike';
            }

            return {
                _id: post._id,
                title: post.title,
                postType: post.postType,
                viewCount: post.viewCount,
                createdAt: post.createdAt,
                userAction,
                score: (post.upvotes?.length || 0) - (post.downvotes?.length || 0),
                likeCount: post.likes?.length || 0,
                dislikeCount: post.dislikes?.length || 0
            };
        });
    }

    async countUserVotes(userId, timeRange = 'all') {
        const objectId = new mongoose.Types.ObjectId(userId);
        const query = {
            $or: [
                { upvotes: objectId },
                { downvotes: objectId },
                { likes: objectId },
                { dislikes: objectId }
            ],
            status: 'active'
        };
        const dateLimit = getDateFilter(timeRange);
        if (dateLimit) {
            query.createdAt = { $gte: dateLimit };
        }
        return await Post.countDocuments(query);
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
