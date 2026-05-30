import Comment from '../model/comment.model.js';

// ====================================================================
// COMMENT REPOSITORY - Tầng Data Access cho bình luận
// ====================================================================

class CommentRepository {

    // Lấy tất cả comment của 1 bài viết (hỗ trợ nested reply)
    // Populate author info + sắp xếp cũ nhất trước (dòng thời gian)
    async findByPostId(postId) {
        return await Comment.find({ post: postId })
            .populate('author', '_id fullName avatar email')
            .sort({ createdAt: 1 });  // Comment cũ nhất lên trước
    }

    async findById(commentId) {
        return await Comment.findById(commentId)
            .populate('author', '_id fullName avatar major email')
            .populate('post', 'title author');
    }

    // Đếm tổng số comment của 1 bài viết
    async countByPostId(postId) {
        return await Comment.countDocuments({ post: postId });
    }
}

export default new CommentRepository();