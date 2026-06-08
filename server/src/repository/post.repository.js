import Post from '../model/post.model.js';

// ====================================================================
// POST REPOSITORY - Tầng Data Access cho bài viết
// ====================================================================

class PostRepository {
    async create(postData) {
        return await Post.create(postData);
    }

    async findById(postId) {
        return await Post.findById(postId)
            .populate('author', '_id fullName avatar major email reputation');
    }

    async incrementViewCount(postId, options = {}) {
        const { resetDaily = false, todayStart = null } = options;
        const update = { $inc: { viewCount: 1 } };

        if (resetDaily && todayStart) {
            update.$set = { dailyViewCount: 1, dailyViewDate: todayStart };
        } else if (todayStart) {
            update.$inc.dailyViewCount = 1;
        }

        return await Post.findByIdAndUpdate(postId, update, { new: true });
    }

    async addUpvote(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $addToSet: { upvotes: userId } }, { new: true });
    }

    async removeUpvote(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $pull: { upvotes: userId } }, { new: true });
    }

    async addDownvote(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $addToSet: { downvotes: userId } }, { new: true });
    }

    async removeDownvote(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $pull: { downvotes: userId } }, { new: true });
    }

    async addLike(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId }, $pull: { dislikes: userId } }, { new: true });
    }

    async removeLike(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true });
    }

    async addDislike(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $addToSet: { dislikes: userId }, $pull: { likes: userId } }, { new: true });
    }

    async removeDislike(postId, userId) {
        return await Post.findByIdAndUpdate(postId, { $pull: { dislikes: userId } }, { new: true });
    }

    async findRelatedByTag(tag, excludePostId, limit = 5) {
        return await Post.find({
            tags: tag,
            _id: { $ne: excludePostId },
            status: 'active'
        })
        .populate('author', '_id fullName avatar email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title tags images upvotes downvotes likes dislikes viewCount createdAt');
    }

    async findPosts(filter, sort, skip, limit) {
        return await Post.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('author', '_id fullName avatar email')
            .lean();
    }

    async countPosts(filter) {
        return await Post.countDocuments(filter);
    }

    async findPostsForList(filter, sortBy, skip, limit) {
        const sortStage = (() => {
            switch (sortBy) {
                case 'MostViewed':
                    return { viewCount: -1 };
                case 'MostUpvoted':
                    return { upvoteCount: -1 };
                case 'Newest':
                default:
                    return { createdAt: -1 };
            }
        })();

        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    upvoteCount: { $cond: [{ $isArray: '$upvotes' }, { $size: { $ifNull: ['$upvotes', []] } }, { $ifNull: ['$upvotes', 0] }] },
                    downvoteCount: { $cond: [{ $isArray: '$downvotes' }, { $size: { $ifNull: ['$downvotes', []] } }, { $ifNull: ['$downvotes', 0] }] },
                    likeCount: { $cond: [{ $isArray: '$likes' }, { $size: { $ifNull: ['$likes', []] } }, 0] },
                    dislikeCount: { $cond: [{ $isArray: '$dislikes' }, { $size: { $ifNull: ['$dislikes', []] } }, 0] },
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
                    as: 'answerMeta',
                },
            },
            { $addFields: { answerCount: { $ifNull: [{ $arrayElemAt: ['$answerMeta.count', 0] }, 0] } } },
            { $project: { answerMeta: 0 } },
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    title: 1,
                    content: 1,
                    tags: 1,
                    status: 1,
                    images: 1,
                    videos: 1,
                    postType: 1,
                    viewCount: 1,
                    upvotes: 1,
                    downvotes: 1,
                    likes: 1,
                    dislikes: 1,
                    upvoteCount: 1,
                    downvoteCount: 1,
                    likeCount: 1,
                    dislikeCount: 1,
                    answerCount: 1,
                    createdAt: 1,
                    author: { _id: 1, fullName: 1, avatar: 1, email: 1, reputation: 1 },
                },
            },
        ];

        return await Post.aggregate(pipeline);
    }

    async findHotNetworkQuestions(limit = 10) {
        return await Post.aggregate([
            { $match: { status: { $ne: 'deleted' } } },
            { $addFields: { upvoteCount: { $cond: [{ $isArray: '$upvotes' }, { $size: { $ifNull: ['$upvotes', []] } }, { $ifNull: ['$upvotes', 0] }] } } },
            { $sort: { viewCount: -1, upvoteCount: -1, createdAt: -1 } },
            { $limit: limit },
            { $project: { _id: 1, title: 1 } },
        ]);
    }

    async findTrendingToday(todayStart, limit = 10) {
        return await Post.aggregate([
            { $match: { status: { $ne: 'deleted' }, dailyViewDate: todayStart, dailyViewCount: { $gt: 0 } } },
            { $sort: { dailyViewCount: -1, viewCount: -1, createdAt: -1 } },
            { $limit: limit },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, title: 1, tags: 1, images: 1, videos: 1, postType: 1, createdAt: 1, viewCount: 1, dailyViewCount: 1, author: { fullName: 1, avatar: 1 } } },
        ]);
    }

    async findTopUpvoted(todayStart, limit = 10) {
        return await Post.aggregate([
            { $match: { status: { $ne: 'deleted' }, dailyUpvoteDate: todayStart, dailyUpvoteCount: { $gt: 0 } } },
            {
                $addFields: {
                    upvoteCount: { $cond: [{ $isArray: '$upvotes' }, { $size: { $ifNull: ['$upvotes', []] } }, { $ifNull: ['$upvotes', 0] }] },
                    downvoteCount: { $cond: [{ $isArray: '$downvotes' }, { $size: { $ifNull: ['$downvotes', []] } }, { $ifNull: ['$downvotes', 0] }] },
                },
            },
            { $sort: { dailyUpvoteCount: -1, upvoteCount: -1, createdAt: -1 } },
            { $limit: limit },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, title: 1, tags: 1, images: 1, videos: 1, postType: 1, createdAt: 1, viewCount: 1, dailyUpvoteCount: 1, upvoteCount: 1, downvoteCount: 1, author: { fullName: 1, avatar: 1 } } },
        ]);
    }

    async updateDailyVoteStats(postId, updates) {
        return await Post.findByIdAndUpdate(postId, { $set: updates }, { new: true });
    }

    async findPopularTags(limit = 8) {
        return await Post.aggregate([
            { $match: { status: { $ne: 'deleted' }, tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            { $match: { tags: { $type: 'string', $ne: '' } } },
            { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: limit },
            { $project: { _id: 0, name: '$_id', count: 1 } },
        ]);
    }
}

export default new PostRepository();