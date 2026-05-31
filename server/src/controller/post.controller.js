import postService from '../service/post.service.js';
import commentRepository from '../repository/comment.repository.js';
import { validationResult } from 'express-validator';

// ====================================================================
// POST CONTROLLER - Tầng Presentation cho bài viết
// Nhận request, validate, gọi Service, trả response
// ====================================================================
const recentViewMap = new Map();
const VIEW_DEDUP_WINDOW_MS = 10 * 1000; // 10s: chống double-call khi reload/dev

const getViewerKey = (req, postId, userId) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return `${userId || `ip:${ip}`}::${postId}`;
};

class PostController {

    // Helper: Kiểm tra lỗi validation (Lớp 1)
    checkValidationErrors(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        return null;
    }

    // ==================== API 0: GET /posts ====================
    // Lấy danh sách bài viết + filter/sort
    async getPosts(req, res) {
        try {
            const result = await postService.getPosts(req.query);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error('[PostController] getPosts error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách bài đăng',
            });
        }
    }

    // ==================== API 1: GET /posts/:id ====================
    // Lấy chi tiết bài viết kèm bình luận (nested replies)
    async getPostDetail(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { id } = req.params;
            const userId = req.user?.userId || null;
            const now = Date.now();
            const viewerKey = getViewerKey(req, id, userId);
            const lastSeenAt = recentViewMap.get(viewerKey) || 0;
            const isWithinDedupWindow = now - lastSeenAt < VIEW_DEDUP_WINDOW_MS;
            const incrementView = !isWithinDedupWindow;

            recentViewMap.set(viewerKey, now);

            if (recentViewMap.size > 5000) {
                for (const [key, ts] of recentViewMap.entries()) {
                    if (now - ts > VIEW_DEDUP_WINDOW_MS * 3) recentViewMap.delete(key);
                }
            }

            const result = await postService.getPostDetail(id, userId, incrementView);

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết bài viết thành công',
                data: result,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    async createComment(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const comment = await postService.createComment(req.params.id, req.user.userId, req.body);

            return res.status(201).json({
                success: true,
                message: 'Thêm bình luận thành công',
                data: comment,
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                message: error.message || 'Không thể thêm bình luận',
            });
        }
    }

    async reactComment(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { commentId } = req.params;
            const { reactionType } = req.body;
            const userId = req.user.userId;

            const comment = await commentRepository.findById(commentId);
            if (!comment) {
                return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
            }

            const likes = Array.isArray(comment.likes) ? comment.likes.map((id) => id.toString()) : [];
            const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes.map((id) => id.toString()) : [];
            const hasLiked = likes.includes(userId);
            const hasDisliked = dislikes.includes(userId);

            let update = {};
            let userReaction = null;

            if (reactionType === 'like') {
                if (hasLiked) {
                    update = { $pull: { likes: userId } };
                } else {
                    update = { $addToSet: { likes: userId }, $pull: { dislikes: userId } };
                    userReaction = 'like';
                }
            }

            if (reactionType === 'dislike') {
                if (hasDisliked) {
                    update = { $pull: { dislikes: userId } };
                } else {
                    update = { $addToSet: { dislikes: userId }, $pull: { likes: userId } };
                    userReaction = 'dislike';
                }
            }

            const updatedComment = await commentRepository.updateReaction(commentId, update);
            const likeCount = Array.isArray(updatedComment.likes) ? updatedComment.likes.length : 0;
            const dislikeCount = Array.isArray(updatedComment.dislikes) ? updatedComment.dislikes.length : 0;

            return res.status(200).json({
                success: true,
                message: 'Cập nhật phản ứng bình luận thành công',
                data: {
                    commentId: updatedComment._id,
                    likeCount,
                    dislikeCount,
                    userReaction,
                },
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                message: error.message || 'Không thể cập nhật phản ứng bình luận',
            });
        }
    }

    // ==================== API 2: POST /posts/:id/vote ====================
    // Xử lý Upvote / Downvote (cần đăng nhập)
    async votePost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { voteType } = req.body;

            const result = await postService.toggleVote(id, userId, voteType);

            res.status(200).json({
                success: true,
                message: 'Vote thành công',
                data: result,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== API 3: GET /posts/related/:tag ====================
    // Lấy danh sách bài viết liên quan cùng tag
    async getRelatedPosts(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { tag } = req.params;
            const { excludePostId } = req.query;

            const relatedPosts = await postService.getRelatedPosts(tag, excludePostId);

            res.status(200).json({
                success: true,
                message: 'Lấy bài viết liên quan thành công',
                data: relatedPosts,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    async getPostDetailSidebar(req, res) {
        try {
            const data = await postService.getPostDetailSidebarData();

            res.status(200).json({
                success: true,
                message: 'Lay du lieu sidebar cho trang chi tiet thanh cong',
                data,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Loi server khi lay du lieu sidebar',
            });
        }
    }

    async getTrendingToday(req, res) {
        try {
            const data = await postService.getTrendingToday(req.query);

            res.status(200).json({
                success: true,
                message: 'Lay du lieu trending hom nay thanh cong',
                data,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Loi server khi lay du lieu trending hom nay',
            });
        }
    }

    async getTopUpvoted(req, res) {
        try {
            const data = await postService.getTopUpvoted(req.query);

            res.status(200).json({
                success: true,
                message: 'Lay du lieu top upvote thanh cong',
                data,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Loi server khi lay du lieu top upvote',
            });
        }
    }
}

export default new PostController();