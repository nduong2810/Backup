import Comment from '../model/comment.model.js';

// ====================================================================
// COMMENT REPOSITORY - Tầng Data Access cho bình luận
// ====================================================================

class CommentRepository {

    // Lấy tất cả comment của 1 bài viết (hỗ trợ nested reply)
    // Populate author info + sắp xếp cũ nhất trước (dòng thời gian)
    async findByPostId(postId) {
        return await Comment.find({ post: postId, isAuthorActive: { $ne: false } })
            .populate('author', 'fullName avatar major email reputation')
            .sort({ createdAt: 1 });  // Comment cũ nhất lên trước
    }

    async findById(commentId) {
        return await Comment.findById(commentId)
            .populate('author', 'fullName avatar major email reputation')
            .populate('post', 'title author');
    }

    async create(data) {
        const comment = await Comment.create(data);
        return await Comment.findById(comment._id)
            .populate('author', 'fullName avatar major email reputation')
            .populate('post', 'title author');
    }

    async updateReaction(commentId, update) {
        return await Comment.findByIdAndUpdate(
            commentId,
            update,
            { new: true }
        ).populate('author', 'fullName avatar major email');
    }

    // Đếm tổng số comment của 1 bài viết
    async countByPostId(postId) {
        return await Comment.countDocuments({ post: postId, isAuthorActive: { $ne: false } });
    }
}

export default new CommentRepository();