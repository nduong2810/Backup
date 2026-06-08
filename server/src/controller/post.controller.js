import mongoose from 'mongoose';
import postService from '../service/post.service.js';
import commentRepository from '../repository/comment.repository.js';
import notificationService from '../service/notification.service.js';
import { emitToPostRoom } from '../socket/socket.js';
import { validationResult } from 'express-validator';

const recentViewMap = new Map();
const VIEW_DEDUP_WINDOW_MS = 10 * 1000;

const getViewerKey = (req, postId, userId) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return `${userId || `ip:${ip}`}::${postId}`;
};

const normalizeObjectId = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        return mongoose.Types.ObjectId.isValid(value) ? value : '';
    }

    if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
    }

    if (typeof value === 'object') {
        if (value._id) return normalizeObjectId(value._id);
        if (value.id) return normalizeObjectId(value.id);
        if (value.$oid) return normalizeObjectId(value.$oid);
        if (value.author) return normalizeObjectId(value.author);
        if (value.user) return normalizeObjectId(value.user);
    }

    return '';
};

class PostController {
    checkValidationErrors(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        return null;
    }

    async createPost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            if (typeof req.body.tags === 'string') {
                try { req.body.tags = JSON.parse(req.body.tags); } catch { req.body.tags = []; }
            }

            const files = {
                images: req.files?.images || [],
                videos: req.files?.videos || [],
            };

            const post = await postService.createPost(req.user.userId, req.body, files);
            return res.status(201).json({ success: true, message: 'Tạo bài đăng thành công', data: post });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi tạo bài đăng' });
        }
    }

    async getPosts(req, res) {
        try {
            const result = await postService.getPosts(req.query, req.user?.userId || null);
            return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
        } catch (error) {
            console.error('[PostController] getPosts error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách bài đăng' });
        }
    }

    async getPostDetail(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { id } = req.params;
            const userId = req.user?.userId || null;
            const now = Date.now();
            const viewerKey = getViewerKey(req, id, userId);
            const lastSeenAt = recentViewMap.get(viewerKey) || 0;
            const incrementView = now - lastSeenAt >= VIEW_DEDUP_WINDOW_MS;
            recentViewMap.set(viewerKey, now);

            if (recentViewMap.size > 5000) {
                for (const [key, ts] of recentViewMap.entries()) {
                    if (now - ts > VIEW_DEDUP_WINDOW_MS * 3) recentViewMap.delete(key);
                }
            }

            const result = await postService.getPostDetail(id, userId, incrementView);
            return res.status(200).json({ success: true, message: 'Lấy chi tiết bài viết thành công', data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

    async createComment(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const files = {
                images: req.files?.images || [],
                videos: req.files?.videos || [],
            };

            const comment = await postService.createComment(req.params.id, req.user.userId, req.body, files);
            const post = comment.post;
            const parentComment = comment.parentComment ? await commentRepository.findById(comment.parentComment) : null;
            const postId = normalizeObjectId(post) || req.params.id;
            const senderId = normalizeObjectId(comment.author) || req.user.userId;
            const postAuthorId = normalizeObjectId(post?.author);
            const parentAuthorId = normalizeObjectId(parentComment?.author);

            emitToPostRoom(postId, 'comment:new', { postId, comment });

            try {
                if (parentComment && parentAuthorId && parentAuthorId !== senderId) {
                    await notificationService.createCommentNotification({
                        recipientId: parentAuthorId,
                        sender: comment.author,
                        post,
                        comment,
                        parentComment,
                        type: 'comment_reply',
                    });
                }

                if (!parentComment && postAuthorId && postAuthorId !== senderId) {
                    await notificationService.createCommentNotification({
                        recipientId: postAuthorId,
                        sender: comment.author,
                        post,
                        comment,
                        type: 'post_comment',
                    });
                }
            } catch (notificationError) {
                console.error('[PostController] create notification error:', notificationError.message || notificationError);
            }

            return res.status(201).json({ success: true, message: 'Thêm bình luận thành công', data: comment });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Không thể thêm bình luận' });
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
            if (!comment) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });

            const likes = Array.isArray(comment.likes) ? comment.likes.map((id) => id.toString()) : [];
            const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes.map((id) => id.toString()) : [];
            const hasLiked = likes.includes(userId);
            const hasDisliked = dislikes.includes(userId);
            let update = {};
            let userReaction = null;

            if (reactionType === 'like') {
                if (hasLiked) update = { $pull: { likes: userId } };
                else {
                    update = { $addToSet: { likes: userId }, $pull: { dislikes: userId } };
                    userReaction = 'like';
                }
            }

            if (reactionType === 'dislike') {
                if (hasDisliked) update = { $pull: { dislikes: userId } };
                else {
                    update = { $addToSet: { dislikes: userId }, $pull: { likes: userId } };
                    userReaction = 'dislike';
                }
            }

            const updatedComment = await commentRepository.updateReaction(commentId, update);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật phản ứng bình luận thành công',
                data: {
                    commentId: updatedComment._id,
                    likeCount: Array.isArray(updatedComment.likes) ? updatedComment.likes.length : 0,
                    dislikeCount: Array.isArray(updatedComment.dislikes) ? updatedComment.dislikes.length : 0,
                    userReaction,
                },
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Không thể cập nhật phản ứng bình luận' });
        }
    }

    async votePost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const result = await postService.toggleVote(req.params.id, req.user.userId, req.body.voteType);
            return res.status(200).json({ success: true, message: 'Vote thành công', data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

    async reactPost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const result = await postService.toggleReaction(req.params.id, req.user.userId, req.body.reactionType);
            return res.status(200).json({ success: true, message: 'Cập nhật like/dislike bài viết thành công', data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Không thể like/dislike bài viết' });
        }
    }

    async getRelatedPosts(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const relatedPosts = await postService.getRelatedPosts(req.params.tag, req.query.excludePostId);
            return res.status(200).json({ success: true, message: 'Lấy bài viết liên quan thành công', data: relatedPosts });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    }

    async getPostDetailSidebar(req, res) {
        try {
            const data = await postService.getPostDetailSidebarData();
            return res.status(200).json({ success: true, message: 'Lay du lieu sidebar cho trang chi tiet thanh cong', data });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Loi server khi lay du lieu sidebar' });
        }
    }

    async getTrendingToday(req, res) {
        try {
            const data = await postService.getTrendingToday(req.query);
            return res.status(200).json({ success: true, message: 'Lay du lieu trending hom nay thanh cong', data });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Loi server khi lay du lieu trending hom nay' });
        }
    }

    async getTopUpvoted(req, res) {
        try {
            const data = await postService.getTopUpvoted(req.query);
            return res.status(200).json({ success: true, message: 'Lay du lieu top upvote thanh cong', data });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Loi server khi lay du lieu top upvote' });
        }
    }
}

export default new PostController();