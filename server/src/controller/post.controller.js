import mongoose from 'mongoose';
import postService from '../service/post.service.js';
import commentRepository from '../repository/comment.repository.js';
import notificationService from '../service/notification.service.js';
import { emitToPostRoom } from '../socket/socket.js';
import { validationResult } from 'express-validator';
import reputationService, { getThisWeekStart } from '../service/reputation.service.js';
import User from '../model/user.model.js';

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

        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Quản trị viên không được phép thực hiện tương tác này.' });
        }

        try {
            const { commentId } = req.params;
            const { reactionType } = req.body;
            const userId = req.user.userId;
            const comment = await commentRepository.findById(commentId);
            if (!comment) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });

            const postStatus = comment.post?.status;
            const isLocked = postStatus === 'resolved' || postStatus === 'hidden' || postStatus === 'deleted';

            if (isLocked) {
                return res.status(423).json({ success: false, message: 'Bài viết đang bị khóa hoặc không hợp lệ' });
            }
            if (postStatus && postStatus !== 'unresolved') {
                return res.status(400).json({ success: false, message: 'Không thể tương tác trên bình luận này' });
            }

            const commentAuthorId = comment.author?._id?.toString() || comment.author?.toString();
            if (commentAuthorId && commentAuthorId === userId) {
                return res.status(400).json({ success: false, message: 'Bạn không thể tự bày tỏ cảm xúc trên bình luận của chính mình.' });
            }

            const likes = Array.isArray(comment.likes) ? comment.likes.map((id) => id.toString()) : [];
            const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes.map((id) => id.toString()) : [];
            const hasLiked = likes.includes(userId);
            const hasDisliked = dislikes.includes(userId);
            let update = {};
            let userReaction = null;

            const isQuestion = comment.post?.postType === 'question';
            let voter = null;
            let showFreeVotesModal = false;

            if (isQuestion) {
                voter = await User.findById(userId);
                if (!voter) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

                const voterRep = voter.reputation || 1;
                const isFreeVote = voterRep < 15;

                // 1. Chặn Downvote đối với nhóm Free Vote (dưới 15 uy tín) khi chưa từng downvote
                if (reactionType === 'dislike' && isFreeVote && !hasDisliked) {
                    return res.status(403).json({ success: false, message: 'Thành viên mới chỉ có thể sử dụng lượt bình chọn miễn phí để Upvote câu trả lời.' });
                }

                // 2. Chặn Downvote đối với thành viên chưa đủ uy tín thực tế (dưới 100 uy tín) khi chưa từng downvote
                if (reactionType === 'dislike' && !isFreeVote && voterRep < 100 && !hasDisliked) {
                    return res.status(403).json({ success: false, message: 'Bạn cần tối thiểu 100 điểm uy tín để Downvote câu trả lời.' });
                }

                if (isFreeVote) {
                    // Kiểm tra reset tuần
                    const weekStart = getThisWeekStart();
                    const sameWeek = voter.weeklyFreeVotesDate &&
                        new Date(voter.weeklyFreeVotesDate).getTime() === weekStart.getTime();

                    if (!sameWeek) {
                        voter.weeklyFreeVotesUsed = 0;
                        voter.weeklyFreeVotesDate = weekStart;
                    }

                    // Kiểm tra xem đây có phải vote mới hoàn toàn (chưa liked và chưa disliked)
                    const isNewVote = !hasLiked && !hasDisliked;
                    if (isNewVote) {
                        if (reactionType === 'like') {
                            if ((voter.weeklyFreeVotesUsed || 0) >= 5) {
                                return res.status(403).json({ success: false, message: 'Bạn đã sử dụng hết 5 lượt bình chọn miễn phí của tuần này. Hãy đóng góp tích cực để nhận upvote và mở khóa toàn bộ quyền bình chọn!' });
                            }
                            voter.weeklyFreeVotesUsed = (voter.weeklyFreeVotesUsed || 0) + 1;

                            // Nếu chưa từng xem popup giới thiệu, bật cờ và lưu lại
                            if (!voter.hasSeenFreeVotesModal) {
                                showFreeVotesModal = true;
                                voter.hasSeenFreeVotesModal = true;
                            }
                        }
                    } else {
                        // Rút lại vote cũ (like/upvote) -> hoàn lại lượt vote miễn phí
                        if (reactionType === 'like' && hasLiked) {
                            voter.weeklyFreeVotesUsed = Math.max(0, (voter.weeklyFreeVotesUsed || 0) - 1);
                        }
                    }
                    await voter.save();
                }
            }

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
            const postId = normalizeObjectId(comment.post);
            
            // Tích hợp điểm uy tín cho Upvote/Downvote bình luận trong bài viết dạng "câu hỏi" (postType = 'question')
            if (isQuestion) {
                const voterRep = voter?.reputation ?? 1;
                const isFreeVote = voterRep < 15;

                const awardCommentRep = async (targetUserId, reason, targetPostId, currentVoterId) => {
                    if (isFreeVote) return;
                    await reputationService.award(targetUserId, reason, targetPostId, currentVoterId);
                };

                const postIdStr = postId ? postId.toString() : null;
                if (reactionType === 'like') {
                    if (hasLiked) {
                        // Hủy Upvote bình luận
                        await awardCommentRep(commentAuthorId, 'comment_upvote_removed', postIdStr, userId);
                    } else {
                        // Thực hiện Upvote bình luận
                        if (hasDisliked) {
                            // Hủy Downvote trước đó
                            await awardCommentRep(commentAuthorId, 'comment_downvote_removed', postIdStr, userId);
                            await awardCommentRep(userId, 'comment_downvote_given_removed', postIdStr, userId);
                        }
                        await awardCommentRep(commentAuthorId, 'comment_upvoted', postIdStr, userId);
                    }
                } else if (reactionType === 'dislike') {
                    if (hasDisliked) {
                        // Hủy Downvote bình luận
                        await awardCommentRep(commentAuthorId, 'comment_downvote_removed', postIdStr, userId);
                        await awardCommentRep(userId, 'comment_downvote_given_removed', postIdStr, userId);
                    } else {
                        // Thực hiện Downvote bình luận
                        if (hasLiked) {
                            // Hủy Upvote trước đó
                            await awardCommentRep(commentAuthorId, 'comment_upvote_removed', postIdStr, userId);
                        }
                        await awardCommentRep(commentAuthorId, 'comment_downvoted', postIdStr, userId);
                        await awardCommentRep(userId, 'comment_downvote_given', postIdStr, userId);
                    }
                }
            }

            if (postId) {
                emitToPostRoom(postId, 'comment:updated', { postId, comment: updatedComment });
            }

            const resData = {
                commentId: updatedComment._id,
                likeCount: Array.isArray(updatedComment.likes) ? updatedComment.likes.length : 0,
                dislikeCount: Array.isArray(updatedComment.dislikes) ? updatedComment.dislikes.length : 0,
                userReaction,
            };

            if (isQuestion && voter) {
                resData.showFreeVotesModal = showFreeVotesModal;
                resData.weeklyFreeVotesUsed = voter.weeklyFreeVotesUsed;
                resData.weeklyFreeVotesLimit = 5;
                resData.userReputation = voter.reputation;
            }

            return res.status(200).json({
                success: true,
                message: 'Cập nhật phản ứng bình luận thành công',
                data: resData,
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Không thể cập nhật phản ứng bình luận' });
        }
    }

    async votePost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Quản trị viên không được phép thực hiện tương tác này.' });
        }

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

        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Quản trị viên không được phép thực hiện tương tác này.' });
        }

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

    async getTrashPosts(req, res) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10 } = req.query;
            const result = await postService.getTrashPosts(userId, page, limit);
            return res.status(200).json({
                success: true,
                message: 'Lấy danh sách bài viết đã xóa thành công',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi lấy bài viết đã xóa' });
        }
    }

    async softDeletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const updatedPost = await postService.softDeletePost(id, userId);
            emitToPostRoom(id, 'post:updated', { postId: id, post: updatedPost });
            return res.status(200).json({ success: true, message: 'Đã di chuyển bài viết vào thùng rác thành công' });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi xóa bài viết' });
        }
    }

    async restorePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const updatedPost = await postService.restorePost(id, userId);
            emitToPostRoom(id, 'post:updated', { postId: id, post: updatedPost });
            return res.status(200).json({ success: true, message: 'Khôi phục bài viết thành công' });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi khôi phục bài viết' });
        }
    }

    async permanentlyDeletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const result = await postService.permanentlyDeletePost(id, userId);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi xóa vĩnh viễn bài viết' });
        }
    }

    async updatePost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { id } = req.params;
            if (typeof req.body.tags === 'string') {
                try { req.body.tags = JSON.parse(req.body.tags); } catch { req.body.tags = []; }
            }

            const files = {
                images: req.files?.images || [],
                videos: req.files?.videos || [],
            };

            const updatedPost = await postService.updatePost(id, req.user.userId, req.body, files);
            emitToPostRoom(id, 'post:updated', { postId: id, post: updatedPost });

            return res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công', data: updatedPost });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi cập nhật bài viết' });
        }
    }

    async updateComment(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { commentId } = req.params;
            const files = {
                images: req.files?.images || [],
                videos: req.files?.videos || [],
            };

            const updatedComment = await postService.updateComment(commentId, req.user.userId, req.body, files);
            const postId = normalizeObjectId(updatedComment.post?._id || updatedComment.post);

            emitToPostRoom(postId, 'comment:updated', { postId, comment: updatedComment });

            return res.status(200).json({ success: true, message: 'Cập nhật bình luận thành công', data: updatedComment });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi cập nhật bình luận' });
        }
    }

    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;
            const result = await postService.deleteComment(commentId, userId);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi xóa bình luận' });
        }
    }

    async acceptComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;
            
            const result = await postService.acceptComment(commentId, userId);
            
            // Notify other clients via Socket.io
            emitToPostRoom(result.postId, 'post:updated', { 
                postId: result.postId,
            });
            
            return res.status(200).json({ 
                success: true, 
                message: result.message, 
                data: { bestAnswer: result.bestAnswer } 
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, message: error.message || 'Lỗi server khi đánh dấu câu trả lời tốt nhất' });
        }
    }
}

export default new PostController();
