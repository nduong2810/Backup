import mongoose from 'mongoose';
import Post from '../model/post.model.js';
import notificationService from '../service/notification.service.js';
import adminAuditLogService from '../service/adminAuditLog.service.js';
import { emitToPostRoom } from '../socket/socket.js';

const STATUS_VALUES = ['unresolved', 'resolved'];
const STATUS_MESSAGES = {
  unresolved: 'Đã mở lại bài viết',
  resolved: 'Đã đóng bài viết',
};

const getObjectId = (value) => {
  const text = String(value || '').trim();
  if (!mongoose.Types.ObjectId.isValid(text)) return null;
  return new mongoose.Types.ObjectId(text);
};

const getUserRoleForPost = (req, post) => {
  if (req.user?.role === 'admin') return 'admin';
  const userId = String(req.user?.userId || '');
  const authorId = String(post.author?._id || post.author || '');
  return userId && authorId && userId === authorId ? 'owner' : '';
};

const safeNotifyAdminPostAction = async ({ post, adminId, status, reason }) => {
  try {
    const authorId = post?.author?._id?.toString() || post?.author?.toString();
    if (!authorId || !adminId || String(authorId) === String(adminId)) return;

    await notificationService.createAdminPostActionNotification({
      recipientId: authorId,
      adminId,
      post,
      status,
      reason,
    });
  } catch (error) {
    console.error('[PostStatusController] notify admin post action failed:', error.message || error);
  }
};

class PostStatusController {
  async updateVisibility(req, res) {
    try {
      const postObjectId = getObjectId(req.params.id);
      const nextStatus = String(req.body?.status || '').trim().toLowerCase();
      const rawReason = String(req.body?.reason || '').trim();
      const isReopening = nextStatus === 'unresolved';
      const reason = isReopening ? '' : rawReason;

      if (!postObjectId) {
        return res.status(400).json({ success: false, message: 'ID bài viết không hợp lệ' });
      }

      if (!STATUS_VALUES.includes(nextStatus)) {
        return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ đóng hoặc mở bài viết' });
      }

      if (!isReopening && !reason) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do đóng bài viết' });
      }

      if (reason.length > 500) {
        return res.status(400).json({ success: false, message: 'Lý do tối đa 500 ký tự' });
      }

      const post = await Post.findById(postObjectId).select('title status author deletedBy statusReason deletedAt');
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const changedByRole = getUserRoleForPost(req, post);
      if (!changedByRole) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền đóng/mở bài viết này' });
      }

      if ((post.status === 'hidden' || post.status === 'deleted') && !(changedByRole === 'admin' && isReopening)) {
        return res.status(400).json({ success: false, message: 'Chỉ admin mới có thể mở lại bài viết đang bị ẩn hoặc đã xóa' });
      }

      if (post.status === nextStatus) {
        return res.status(400).json({
          success: false,
          message: nextStatus === 'resolved' ? 'Bài viết đã được đóng trước đó' : 'Bài viết đang mở',
        });
      }

      const previousState = {
        status: post.status,
        statusReason: post.statusReason || '',
        deletedAt: post.deletedAt || null,
        deletedBy: post.deletedBy || null,
      };
      const changedAt = new Date();
      const updateQuery = {
        $set: {
          status: nextStatus,
          statusChangedBy: req.user.userId,
          statusChangedByRole: changedByRole,
          statusChangedAt: changedAt,
        },
        $push: {
          statusHistory: {
            status: nextStatus,
            reason,
            changedBy: req.user.userId,
            changedByRole,
            changedAt,
          },
        },
      };

      if (isReopening) {
        updateQuery.$unset = { statusReason: '', deletedAt: '', deletedBy: '' };
      } else {
        updateQuery.$set.statusReason = reason;
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postObjectId,
        updateQuery,
        { new: true },
      )
        .populate('author', '_id fullName avatar major email reputation role')
        .populate('statusChangedBy', '_id fullName email');

      emitToPostRoom(String(postObjectId), 'post:updated', { postId: String(postObjectId), post: updatedPost });

      if (changedByRole === 'admin') {
        await Promise.all([
          safeNotifyAdminPostAction({
            post: updatedPost,
            adminId: req.user.userId,
            status: nextStatus,
            reason,
          }),
          adminAuditLogService.log({
            req,
            action: 'post_status_update',
            targetType: 'post',
            targetId: postObjectId,
            targetLabel: updatedPost?.title || post.title || '',
            previousState,
            newState: {
              status: nextStatus,
              statusReason: reason,
              deletedAt: updatedPost?.deletedAt || null,
              deletedBy: updatedPost?.deletedBy || null,
            },
            reason,
            metadata: {
              source: 'post_detail_visibility',
              authorId: updatedPost?.author?._id || post.author,
              authorName: updatedPost?.author?.fullName || '',
              authorEmail: updatedPost?.author?.email || '',
            },
          }),
        ]);
      }

      return res.status(200).json({
        success: true,
        message: STATUS_MESSAGES[nextStatus] || 'Đã cập nhật trạng thái bài viết',
        data: updatedPost,
      });
    } catch (error) {
      console.error('[PostStatusController] updateVisibility error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Không thể cập nhật trạng thái bài viết' });
    }
  }
}

export default new PostStatusController();