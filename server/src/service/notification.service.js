import mongoose from 'mongoose';
import notificationRepository from '../repository/notification.repository.js';
import { emitToUser } from '../socket/socket.js';

const getSenderName = (sender) => sender?.fullName || sender?.email || 'Người dùng';

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
  }

  return '';
};

class NotificationService {
  async createCommentNotification({ recipientId, sender, post, comment, parentComment = null, type }) {
    const safeRecipientId = normalizeObjectId(recipientId);
    const senderId = normalizeObjectId(sender);
    const postId = normalizeObjectId(post);
    const commentId = normalizeObjectId(comment);
    const parentCommentId = normalizeObjectId(parentComment);

    if (!safeRecipientId || !senderId || !postId || !commentId) return null;
    if (safeRecipientId === senderId) return null;

    const senderName = getSenderName(sender);
    const isReply = type === 'comment_reply';

    const notification = await notificationRepository.create({
      recipient: safeRecipientId,
      sender: senderId,
      post: postId,
      comment: commentId,
      parentComment: parentCommentId || null,
      type: isReply ? 'comment_reply' : 'post_comment',
      title: isReply ? 'Có người trả lời bình luận của bạn' : 'Có người bình luận bài viết của bạn',
      message: isReply
        ? `${senderName} đã trả lời bình luận của bạn.`
        : `${senderName} đã bình luận bài viết của bạn.`,
      link: `/posts/${postId}`,
    });

    const unreadCount = await notificationRepository.countUnread(safeRecipientId);
    emitToUser(safeRecipientId, 'notification:new', { notification, unreadCount });

    return notification;
  }

  async list(userId, limit = 20) {
    const safeUserId = normalizeObjectId(userId);
    const notifications = await notificationRepository.findByRecipient(safeUserId, limit);
    const unreadCount = await notificationRepository.countUnread(safeUserId);
    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    const safeUserId = normalizeObjectId(userId);
    await notificationRepository.markAsRead(notificationId, safeUserId);
    const unreadCount = await notificationRepository.countUnread(safeUserId);
    emitToUser(safeUserId, 'notification:unread-count', { unreadCount });
    return { unreadCount };
  }

  async markAllAsRead(userId) {
    const safeUserId = normalizeObjectId(userId);
    await notificationRepository.markAllAsRead(safeUserId);
    emitToUser(safeUserId, 'notification:unread-count', { unreadCount: 0 });
    return { unreadCount: 0 };
  }
}

export default new NotificationService();
