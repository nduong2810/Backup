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
}

export default new PostRepository();
