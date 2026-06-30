import mongoose from 'mongoose';
import Notification from '../model/notification.model.js';

const ALWAYS_VISIBLE_TYPES = ['admin_post_action', 'report_outcome', 'donation_rejected'];

const postVisibilityMatch = {
  postDoc: { $exists: true, $ne: null },
  $or: [
    { type: { $in: ALWAYS_VISIBLE_TYPES } },
    {
      $and: [
        { 'postDoc.status': { $nin: ['hidden', 'deleted'] } },
        { 'postDoc.isAuthorActive': { $ne: false } },
      ],
    },
  ],
};

const commentVisibilityMatch = {
  $or: [
    { comment: null },
    { type: { $in: ALWAYS_VISIBLE_TYPES } },
    {
      $and: [
        { commentDoc: { $exists: true, $ne: null } },
        { 'commentDoc.isAuthorActive': { $ne: false } },
      ],
    },
  ],
};

class NotificationRepository {
  async create(data) {
    const notification = await Notification.create(data);
    return await Notification.findById(notification._id)
      .populate('sender', 'fullName avatar email')
      .populate('post', 'title status');
  }

  async findByRecipient(userId, limit = 20) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    const safeUserId = new mongoose.Types.ObjectId(userId);
    return await Notification.aggregate([
      { $match: { recipient: safeUserId } },
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDoc'
        }
      },
      { $unwind: { path: '$postDoc', preserveNullAndEmptyArrays: true } },
      { $match: postVisibilityMatch },
      {
        $lookup: {
          from: 'comments',
          localField: 'comment',
          foreignField: '_id',
          as: 'commentDoc'
        }
      },
      { $unwind: { path: '$commentDoc', preserveNullAndEmptyArrays: true } },
      { $match: commentVisibilityMatch },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderDoc'
        }
      },
      { $unwind: { path: '$senderDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          recipient: 1,
          type: 1,
          title: 1,
          message: 1,
          link: 1,
          isRead: 1,
          parentComment: 1,
          createdAt: 1,
          updatedAt: 1,
          post: { _id: '$postDoc._id', title: '$postDoc.title', status: '$postDoc.status' },
          comment: { $cond: { if: { $not: ['$commentDoc'] }, then: null, else: '$commentDoc' } },
          sender: {
            _id: '$senderDoc._id',
            fullName: '$senderDoc.fullName',
            avatar: '$senderDoc.avatar',
            email: '$senderDoc.email'
          }
        }
      }
    ]);
  }

  async countUnread(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return 0;
    }
    const safeUserId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.aggregate([
      { $match: { recipient: safeUserId, isRead: false } },
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDoc'
        }
      },
      { $unwind: { path: '$postDoc', preserveNullAndEmptyArrays: true } },
      { $match: postVisibilityMatch },
      {
        $lookup: {
          from: 'comments',
          localField: 'comment',
          foreignField: '_id',
          as: 'commentDoc'
        }
      },
      { $unwind: { path: '$commentDoc', preserveNullAndEmptyArrays: true } },
      { $match: commentVisibilityMatch },
      { $count: 'unreadCount' }
    ]);
    return result[0]?.unreadCount ?? 0;
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