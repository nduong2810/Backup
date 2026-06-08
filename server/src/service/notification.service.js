import notificationRepository from '../repository/notification.repository.js';
import { emitToUser } from '../socket/socket.js';

const getSenderName = (sender) => sender?.fullName || sender?.email || 'Người dùng';

class NotificationService {
  async createCommentNotification({ recipientId, sender, post, comment, parentComment = null, type }) {
    if (!recipientId || !sender || !post || !comment) return null;

    const senderId = sender?._id?.toString?.() || sender?.toString?.() || '';
    if (senderId && String(recipientId) === String(senderId)) return null;

    const postId = post?._id?.toString?.() || post?.toString?.() || '';
    const senderName = getSenderName(sender);
    const isReply = type === 'comment_reply';

    const notification = await notificationRepository.create({
      recipient: recipientId,
      sender: senderId,
      post: postId,
      comment: comment._id,
      parentComment: parentComment?._id || parentComment || null,
      type: isReply ? 'comment_reply' : 'post_comment',
      title: isReply ? 'Có người trả lời bình luận của bạn' : 'Có người bình luận bài viết của bạn',
      message: isReply
        ? `${senderName} đã trả lời bình luận của bạn.`
        : `${senderName} đã bình luận bài viết của bạn.`,
      link: `/posts/${postId}`,
    });

    const unreadCount = await notificationRepository.countUnread(recipientId);
    emitToUser(recipientId, 'notification:new', { notification, unreadCount });

    return notification;
  }

  async list(userId, limit = 20) {
    const notifications = await notificationRepository.findByRecipient(userId, limit);
    const unreadCount = await notificationRepository.countUnread(userId);
    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    await notificationRepository.markAsRead(notificationId, userId);
    const unreadCount = await notificationRepository.countUnread(userId);
    emitToUser(userId, 'notification:unread-count', { unreadCount });
    return { unreadCount };
  }

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    emitToUser(userId, 'notification:unread-count', { unreadCount: 0 });
    return { unreadCount: 0 };
  }
}

export default new NotificationService();
