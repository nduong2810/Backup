import notificationService from '../service/notification.service.js';

class NotificationController {
  async getMyNotifications(req, res) {
    try {
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const data = await notificationService.list(req.user.userId, limit);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể tải thông báo',
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const data = await notificationService.markAsRead(req.params.id, req.user.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể đánh dấu đã đọc thông báo',
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const data = await notificationService.markAllAsRead(req.user.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể đánh dấu tất cả thông báo',
      });
    }
  }
}

export default new NotificationController();
