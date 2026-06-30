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
    if (value.author) return normalizeObjectId(value.author);
    if (value.post) return normalizeObjectId(value.post);
  }

  return '';
};

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const postTitleOf = (post, fallback = 'bài viết') => pickText(post?.title, post?.postSnapshot?.title, fallback);

const statusActionLabel = (status) => {
  switch (status) {
    case 'resolved': return 'đóng/khóa';
    case 'unresolved': return 'mở lại';
    case 'hidden': return 'ẩn';
    case 'deleted': return 'xóa';
    default: return 'cập nhật trạng thái';
  }
};

const reportStatusLabel = (status) => {
  switch (status) {
    case 'action_taken': return 'được chấp nhận và đã xử lý';
    case 'closed': return 'đã đóng, không xử lý';
    case 'retracted': return 'đã được rút lại';
    default: return 'đã được cập nhật';
  }
};

class NotificationService {
  async createAndEmit(data) {
    const recipientId = normalizeObjectId(data.recipient);
    const senderId = normalizeObjectId(data.sender);
    const postId = normalizeObjectId(data.post);

    if (!recipientId || !senderId || !postId) return null;
    if (recipientId === senderId) return null;

    const notification = await notificationRepository.create({
      ...data,
      recipient: recipientId,
      sender: senderId,
      post: postId,
      comment: normalizeObjectId(data.comment) || null,
      parentComment: normalizeObjectId(data.parentComment) || null,
      link: data.link || `/posts/${postId}`,
    });

    const unreadCount = await notificationRepository.countUnread(recipientId);
    emitToUser(recipientId, 'notification:new', { notification, unreadCount });

    return notification;
  }

  async createCommentNotification({ recipientId, sender, post, comment, parentComment = null, type }) {
    const senderName = getSenderName(sender);
    const isReply = type === 'comment_reply';

    return this.createAndEmit({
      recipient: recipientId,
      sender,
      post,
      comment,
      parentComment,
      type: isReply ? 'comment_reply' : 'post_comment',
      title: isReply ? 'Có người trả lời bình luận của bạn' : 'Có người bình luận bài viết của bạn',
      message: isReply
        ? `${senderName} đã trả lời bình luận của bạn.`
        : `${senderName} đã bình luận bài viết của bạn.`,
    });
  }

  async createPostVoteNotification({ recipientId, sender, post, voteType }) {
    const senderName = getSenderName(sender);
    const label = voteType === 'downvote' ? 'downvote' : 'upvote';
    const title = voteType === 'downvote' ? 'Bài viết của bạn nhận downvote' : 'Bài viết của bạn nhận upvote';

    return this.createAndEmit({
      recipient: recipientId,
      sender,
      post,
      type: 'post_vote',
      title,
      message: `${senderName} đã ${label} bài viết "${postTitleOf(post)}".`,
    });
  }

  async createDonationApprovedNotification({ donorId, adminId, post, donation }) {
    const amount = formatCurrency(donation?.amount);
    const postTitle = donation?.postSnapshot?.title || donation?.post?.title || 'bài viết';

    return this.createAndEmit({
      recipient: donorId,
      sender: adminId,
      post,
      type: 'donation_approved',
      title: 'Giao dịch chuyển khoản đã được duyệt',
      message: `Bill chuyển khoản ${amount}đ cho "${postTitle}" đã được admin duyệt thành công.`,
    });
  }

  async createDonationRejectedNotification({ donorId, adminId, post, donation, reason = '' }) {
    const amount = formatCurrency(donation?.amount);
    const postTitle = donation?.postSnapshot?.title || donation?.post?.title || 'bài viết';
    const cleanReason = String(reason || '').trim();
    const suffix = cleanReason ? ` Lý do: ${cleanReason}` : '';

    return this.createAndEmit({
      recipient: donorId,
      sender: adminId,
      post,
      type: 'donation_rejected',
      title: 'Giao dịch chuyển khoản chưa được duyệt',
      message: `Bill chuyển khoản ${amount}đ cho "${postTitle}" chưa được admin duyệt.${suffix}`,
    });
  }

  async createDonationReceivedNotification({ authorId, donor, post, donation }) {
    const amount = formatCurrency(donation?.amount);
    const donorName = donation?.donorSnapshot?.fullName || getSenderName(donor) || 'Người dùng';
    const postTitle = donation?.postSnapshot?.title || donation?.post?.title || post?.title || 'bài viết';

    return this.createAndEmit({
      recipient: authorId,
      sender: donor,
      post,
      type: 'donation_received',
      title: 'Bạn vừa nhận được một lượt ủng hộ',
      message: `${donorName} đã ủng hộ ${amount}đ cho "${postTitle}".`,
    });
  }

  async createAdminPostActionNotification({ recipientId, adminId, post, status, reason = '' }) {
    const actionLabel = statusActionLabel(status);
    const cleanReason = String(reason || '').trim();
    const suffix = cleanReason ? ` Lý do: ${cleanReason}` : '';

    return this.createAndEmit({
      recipient: recipientId,
      sender: adminId,
      post,
      type: 'admin_post_action',
      title: `Admin đã ${actionLabel} bài viết của bạn`,
      message: `Admin đã ${actionLabel} bài viết "${postTitleOf(post)}".${suffix}`,
    });
  }

  async createReportOutcomeNotification({ reporterId, adminId, post, report, status, note = '' }) {
    const cleanNote = String(note || '').trim();
    const suffix = cleanNote ? ` Ghi chú: ${cleanNote}` : '';
    const targetLabel = report?.comment ? 'bình luận' : 'bài viết';

    return this.createAndEmit({
      recipient: reporterId,
      sender: adminId,
      post,
      comment: report?.comment || null,
      type: 'report_outcome',
      title: 'Kết quả xử lý báo cáo',
      message: `Báo cáo ${targetLabel} của bạn ${reportStatusLabel(status)}.${suffix}`,
    });
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