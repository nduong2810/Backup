import Notification from '../model/notification.model.js';

class NotificationRepository {
  async create(data) {
    const notification = await Notification.create(data);
    return await Notification.findById(notification._id)
      .populate('sender', 'fullName avatar email')
      .populate('post', 'title');
  }

  async findByRecipient(userId, limit = 20) {
    return await Notification.find({ recipient: userId })
      .populate('sender', 'fullName avatar email')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countUnread(userId) {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

export default new NotificationRepository();
