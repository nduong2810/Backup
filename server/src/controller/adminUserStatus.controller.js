import mongoose from 'mongoose';
import User from '../model/user.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import adminAuditLogService from '../service/adminAuditLog.service.js';

const getObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(String(value || '').trim())) return null;
  return new mongoose.Types.ObjectId(String(value).trim());
};

class AdminUserStatusController {
  async toggleUserStatus(req, res) {
    try {
      const userObjectId = getObjectId(req.params.userId);
      if (!userObjectId) {
        return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
      }

      const { isActive } = req.body;
      const reason = String(req.body?.reason || '').trim() || (isActive ? 'Admin mở khóa tài khoản' : 'Admin khóa tài khoản');

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      if (String(userObjectId) === String(req.user.userId)) {
        return res.status(400).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản của chính bạn' });
      }

      const targetUser = await User.findById(userObjectId).select('role fullName email isActive');
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
      }

      if (targetUser.role === 'admin') {
        return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản quản trị viên' });
      }

      const previousState = { isActive: targetUser.isActive };
      targetUser.isActive = isActive;
      await targetUser.save();

      await Promise.all([
        Post.updateMany({ author: userObjectId }, { $set: { isAuthorActive: isActive } }),
        Comment.updateMany({ author: userObjectId }, { $set: { isAuthorActive: isActive } }),
        adminAuditLogService.log({
          req,
          action: 'user_status_update',
          targetType: 'user',
          targetId: userObjectId,
          targetLabel: `${targetUser.fullName || 'Không rõ'} <${targetUser.email || ''}>`,
          previousState,
          newState: { isActive },
          reason,
          metadata: {
            targetUserName: targetUser.fullName || '',
            targetUserEmail: targetUser.email || '',
          },
        }),
      ]);

      const statusMessage = isActive
        ? `Đã mở khóa tài khoản "${targetUser.fullName}"`
        : `Đã khóa tài khoản "${targetUser.fullName}"`;

      return res.status(200).json({
        success: true,
        message: statusMessage,
        data: {
          _id: targetUser._id,
          isActive: targetUser.isActive,
          auditReason: reason,
        },
      });
    } catch (error) {
      console.error('[AdminUserStatusController] toggleUserStatus error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể cập nhật trạng thái thành viên',
      });
    }
  }
}

export default new AdminUserStatusController();
