import mongoose from 'mongoose';
import Notification from '../model/notification.model.js';

class NotificationRepository {
  async create(data) {
    const notification = await Notification.create(data);
    return await Notification.findById(notification._id)
      .populate('sender', 'fullName avatar email')
      .populate('post', 'title');
  }

  async findByRecipient(userId, limit = 20) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    const safeUserId = new mongoose.Types.ObjectId(userId);
    return await Notification.aggregate([
      { $match: { recipient: safeUserId } },
      // Tìm kiếm thông tin bài viết
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDoc'
        }
      },
      {
        $unwind: {
          path: '$postDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lọc bỏ thông báo nếu bài viết không tồn tại, bị ẩn, bị xóa mềm, hoặc tác giả bài viết bị khóa
      {
        $match: {
          postDoc: { $exists: true, $ne: null },
          'postDoc.status': { $nin: ['hidden', 'deleted'] },
          'postDoc.isAuthorActive': { $ne: false }
        }
      },
      // Tìm kiếm thông tin bình luận nếu có
      {
        $lookup: {
          from: 'comments',
          localField: 'comment',
          foreignField: '_id',
          as: 'commentDoc'
        }
      },
      {
        $unwind: {
          path: '$commentDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lọc bỏ thông báo liên quan đến bình luận nếu bình luận đã bị xóa hoặc tác giả bình luận bị khóa
      {
        $match: {
          $or: [
            { comment: null },
            {
              $and: [
                { commentDoc: { $exists: true, $ne: null } },
                { 'commentDoc.isAuthorActive': { $ne: false } }
              ]
            }
          ]
        }
      },
      // Sắp xếp theo thời gian tạo mới nhất
      { $sort: { createdAt: -1 } },
      // Giới hạn số lượng kết quả
      { $limit: limit },
      // Tìm kiếm thông tin người gửi thông báo
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderDoc'
        }
      },
      {
        $unwind: {
          path: '$senderDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      // Định dạng cấu trúc đầu ra khớp với populate của Mongoose
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
          post: {
            _id: '$postDoc._id',
            title: '$postDoc.title',
            status: '$postDoc.status'
          },
          comment: {
            $cond: {
              if: { $not: ['$commentDoc'] },
              then: null,
              else: '$commentDoc'
            }
          },
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
      // Tìm kiếm thông tin bài viết
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDoc'
        }
      },
      {
        $unwind: {
          path: '$postDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          postDoc: { $exists: true, $ne: null },
          'postDoc.status': { $nin: ['hidden', 'deleted'] },
          'postDoc.isAuthorActive': { $ne: false }
        }
      },
      // Tìm kiếm thông tin bình luận nếu có
      {
        $lookup: {
          from: 'comments',
          localField: 'comment',
          foreignField: '_id',
          as: 'commentDoc'
        }
      },
      {
        $unwind: {
          path: '$commentDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { comment: null },
            {
              $and: [
                { commentDoc: { $exists: true, $ne: null } },
                { 'commentDoc.isAuthorActive': { $ne: false } }
              ]
            }
          ]
        }
      },
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
