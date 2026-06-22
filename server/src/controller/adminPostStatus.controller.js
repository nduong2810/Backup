import mongoose from 'mongoose';
import Post from '../model/post.model.js';
import notificationService from '../service/notification.service.js';
import adminAuditLogService from '../service/adminAuditLog.service.js';

const POST_STATUS_VALUES = ['unresolved', 'resolved', 'hidden', 'deleted'];

const POST_STATUS_MESSAGES = {
  unresolved: 'Bài viết đang hiển thị',
  resolved: 'Bài viết đã bị khóa/giải quyết',
  hidden: 'Bài viết đang bị ẩn',
  deleted: 'Bài viết đã bị xóa',
};

const getObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(String(value || '').trim())) return null;
  return new mongoose.Types.ObjectId(String(value).trim());
};

const safeNotifyAuthor = async ({ post, adminId, status, reason }) => {
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
    console.error('[AdminPostStatusController] notify author failed:', error.message || error);
  }
};

class AdminPostStatusController {
  async updatePostStatus(req, res) {
    try {
      const postObjectId = getObjectId(req.params.postId);
      const status = String(req.body.status || '').trim().toLowerCase();
      const reason = String(req.body.reason || '').trim() || 'Admin cập nhật trạng thái bài viết';

      if (!postObjectId) {
        return res.status(400).json({ success: false, message: 'ID bài viết không hợp lệ' });
      }
      if (!POST_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái bài viết không hợp lệ' });
      }

      const currentPost = await Post.findById(postObjectId).select('title status author statusReason deletedAt deletedBy');
      if (!currentPost) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const changedAt = new Date();
      const updateFields = {
        status,
        statusReason: reason,
        statusChangedBy: req.user.userId,
        statusChangedByRole: 'admin',
        statusChangedAt: changedAt,
      };

      const updateQuery = {
        $set: updateFields,
        $push: {
          statusHistory: {
            status,
            reason,
            changedBy: req.user.userId,
            changedByRole: 'admin',
            changedAt,
          },
        },
      };

      if (status === 'deleted') {
        updateQuery.$set.deletedAt = changedAt;
        updateQuery.$set.deletedBy = 'admin';
      } else {
        updateQuery.$unset = { deletedAt: '', deletedBy: '' };
      }

      const post = await Post.findByIdAndUpdate(
        postObjectId,
        updateQuery,
        { new: true },
      )
        .populate('author', '_id fullName email avatar')
        .lean();

      await Promise.all([
        safeNotifyAuthor({ post, adminId: req.user.userId, status, reason }),
        adminAuditLogService.log({
          req,
          action: 'post_status_update',
          targetType: 'post',
          targetId: postObjectId,
          targetLabel: post?.title || currentPost.title || '',
          previousState: {
            status: currentPost.status,
            statusReason: currentPost.statusReason || '',
            deletedAt: currentPost.deletedAt || null,
            deletedBy: currentPost.deletedBy || null,
          },
          newState: {
            status,
            statusReason: reason,
            deletedAt: post?.deletedAt || null,
            deletedBy: post?.deletedBy || null,
          },
          reason,
          metadata: {
            authorId: post?.author?._id || currentPost.author,
            authorName: post?.author?.fullName || '',
            authorEmail: post?.author?.email || '',
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: POST_STATUS_MESSAGES[status] || 'Đã cập nhật trạng thái bài viết',
        data: post,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể cập nhật trạng thái bài viết',
      });
    }
  }
}

export default new AdminPostStatusController();
