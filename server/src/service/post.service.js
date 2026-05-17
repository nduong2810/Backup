import postRepository from '../repository/post.repository.js';
import commentRepository from '../repository/comment.repository.js';

// ====================================================================
// POST SERVICE - Tầng Business Logic cho bài viết
// Xử lý nghiệp vụ: xem chi tiết, vote, bài viết liên quan
// ====================================================================

class PostService {

    // ==================== API 1: LẤY CHI TIẾT BÀI VIẾT ====================
    async getPostDetail(postId, userId = null, incrementView = true) {
        // 1. Tìm bài viết theo ID
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        // 2. Kiểm tra bài viết đã bị xóa chưa
        if (post.status === 'deleted') {
            throw { status: 410, message: 'Bài viết đã bị xóa' };
        }

        // 3. Tăng lượt xem (+1)
        if (incrementView) {
            await postRepository.incrementViewCount(postId);
        }

        // 4. Lấy danh sách comments + tổng số comment
        const comments = await commentRepository.findByPostId(postId);
        const commentCount = await commentRepository.countByPostId(postId);

        // 5. Xây dựng cây comment (nested replies)
        const commentTree = this._buildCommentTree(comments);

        // 6. Trả về dữ liệu đầy đủ
        let userVote = null;
        if (userId) {
            const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
            const hasDownvoted = post.downvotes.some(id => id.toString() === userId);
            if (hasUpvoted) userVote = 'upvote';
            else if (hasDownvoted) userVote = 'downvote';
        }

        return {
            post: {
                ...post.toObject(),
                viewCount: post.viewCount + (incrementView ? 1 : 0),  // Hiển thị viewCount đã cập nhật
                userVote,                        // Trạng thái vote hiện tại của user (nếu đã đăng nhập)
            },
            comments: commentTree,
            commentCount,
        };
    }

    // ==================== API 2: XỬ LÝ VOTE ====================
    async toggleVote(postId, userId, voteType) {
        // 1. Kiểm tra bài viết tồn tại
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        if (post.status !== 'active') {
            throw { status: 400, message: 'Không thể vote bài viết này' };
        }

        // 2. Kiểm tra trạng thái vote hiện tại của user
        const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
        const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

        let userVote = null;  // null = chưa vote, 'upvote', 'downvote'

        if (voteType === 'upvote') {
            if (hasUpvoted) {
                // Đã upvote → bấm lại → BỎ upvote (toggle off)
                await postRepository.removeUpvote(postId, userId);
                userVote = null;
            } else {
                // Nếu đang downvote → bỏ downvote trước
                if (hasDownvoted) {
                    await postRepository.removeDownvote(postId, userId);
                }
                // Thêm upvote
                await postRepository.addUpvote(postId, userId);
                userVote = 'upvote';
            }
        } else if (voteType === 'downvote') {
            if (hasDownvoted) {
                // Đã downvote → bấm lại → BỎ downvote (toggle off)
                await postRepository.removeDownvote(postId, userId);
                userVote = null;
            } else {
                // Nếu đang upvote → bỏ upvote trước
                if (hasUpvoted) {
                    await postRepository.removeUpvote(postId, userId);
                }
                // Thêm downvote
                await postRepository.addDownvote(postId, userId);
                userVote = 'downvote';
            }
        }

        // 3. Lấy bài viết đã cập nhật để trả về số liệu mới
        const updatedPost = await postRepository.findById(postId);

        return {
            upvoteCount: updatedPost.upvotes.length,
            downvoteCount: updatedPost.downvotes.length,
            userVote,  // Trạng thái vote của user sau thao tác
        };
    }

    // ==================== API 3: BÀI VIẾT LIÊN QUAN ====================
    async getRelatedPosts(tag, excludePostId) {
        if (!tag || tag.trim() === '') {
            throw { status: 400, message: 'Tag không được để trống' };
        }

        const relatedPosts = await postRepository.findRelatedByTag(
            tag.toLowerCase().trim(),
            excludePostId,
            5  // Giới hạn 5 bài
        );

        return relatedPosts;
    }

    // ==================== HELPER: Xây dựng cây comment ====================
    // Chuyển danh sách flat comments thành cây nested (parent → replies)
    _buildCommentTree(comments) {
        const commentMap = {};
        const rootComments = [];

        // Bước 1: Tạo map từ tất cả comment
        comments.forEach(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = [];  // Mảng chứa reply
            commentMap[commentObj._id.toString()] = commentObj;
        });

        // Bước 2: Gắn reply vào parent tương ứng
        comments.forEach(comment => {
            const commentObj = commentMap[comment._id.toString()];
            if (comment.parentComment) {
                // Là reply → gắn vào parent
                const parentId = comment.parentComment.toString();
                if (commentMap[parentId]) {
                    commentMap[parentId].replies.push(commentObj);
                }
            } else {
                // Là comment gốc → đẩy vào mảng root
                rootComments.push(commentObj);
            }
        });

        return rootComments;
    }
}

export default new PostService();
