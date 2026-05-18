import Post from '../model/post.model.js';

// ====================================================================
// POST REPOSITORY - Tầng Data Access cho bài viết
// Chỉ chứa các thao tác CRUD với Database, không chứa business logic
// ====================================================================

class PostRepository {

    // Tìm bài viết theo ID + populate thông tin author
    async findById(postId) {
        return await Post.findById(postId)
            .populate('author', 'fullName avatar major');  // Chỉ lấy các field cần hiển thị
    }

    // Tăng viewCount +1 mỗi khi xem chi tiết bài viết
    async incrementViewCount(postId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $inc: { viewCount: 1 } },
            { new: true }
        );
    }

    // ==================== VOTE OPERATIONS ====================
    // Sử dụng $addToSet / $pull để thao tác trên mảng upvotes/downvotes

    // Thêm userId vào mảng upvotes (không trùng lặp nhờ $addToSet)
    async addUpvote(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { upvotes: userId } },
            { new: true }
        );
    }

    // Xóa userId khỏi mảng upvotes
    async removeUpvote(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $pull: { upvotes: userId } },
            { new: true }
        );
    }

    // Thêm userId vào mảng downvotes
    async addDownvote(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { downvotes: userId } },
            { new: true }
        );
    }

    // Xóa userId khỏi mảng downvotes
    async removeDownvote(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $pull: { downvotes: userId } },
            { new: true }
        );
    }

    // ==================== RELATED POSTS ====================

    // Tìm bài viết liên quan cùng tag (trừ bài hiện tại)
    async findRelatedByTag(tag, excludePostId, limit = 5) {
        return await Post.find({
            tags: tag,
            _id: { $ne: excludePostId },   // Loại bỏ bài viết hiện tại
            status: 'active'                // Chỉ lấy bài đang active
        })
        .populate('author', 'fullName avatar')
        .sort({ createdAt: -1 })            // Mới nhất trước
        .limit(limit)
        .select('title tags images upvotes downvotes viewCount createdAt');  // Chỉ lấy field cần thiết
    }

        // ==================== LIST POSTS ====================

        async findPosts(filter, sort, skip, limit) {
                return await Post.find(filter)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .populate('author', 'fullName avatar')
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
                        upvoteCount: {
                            $cond: [
                                { $isArray: '$upvotes' },
                                { $size: { $ifNull: ['$upvotes', []] } },
                                { $ifNull: ['$upvotes', 0] },
                            ],
                        },
                        downvoteCount: {
                            $cond: [
                                { $isArray: '$downvotes' },
                                { $size: { $ifNull: ['$downvotes', []] } },
                                { $ifNull: ['$downvotes', 0] },
                            ],
                        },
                    },
                },
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
                        viewCount: 1,
                        upvoteCount: 1,
                        downvoteCount: 1,
                        createdAt: 1,
                        author: { fullName: 1, avatar: 1 },
                    },
                },
            ];

            return await Post.aggregate(pipeline);
        }

        async findHotNetworkQuestions(limit = 10) {
            return await Post.aggregate([
                { $match: { status: { $ne: 'deleted' } } },
                {
                    $addFields: {
                        upvoteCount: {
                            $cond: [
                                { $isArray: '$upvotes' },
                                { $size: { $ifNull: ['$upvotes', []] } },
                                { $ifNull: ['$upvotes', 0] },
                            ],
                        },
                    },
                },
                { $sort: { viewCount: -1, upvoteCount: -1, createdAt: -1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                    },
                },
            ]);
        }

        async findPopularTags(limit = 8) {
            return await Post.aggregate([
                { $match: { status: { $ne: 'deleted' }, tags: { $exists: true, $ne: [] } } },
                { $unwind: '$tags' },
                { $match: { tags: { $type: 'string', $ne: '' } } },
                {
                    $group: {
                        _id: { $toLower: '$tags' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1, _id: 1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        tag: '$_id',
                        count: 1,
                    },
                },
            ]);
        }
}

export default new PostRepository();
