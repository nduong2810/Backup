import mongoose from 'mongoose';
import AdminAuditLog from '../model/adminAuditLog.model.js';

const ACTION_VALUES = ['user_status_update', 'post_status_update', 'donation_approved', 'donation_rejected'];
const TARGET_TYPE_VALUES = ['user', 'post', 'donation'];

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeObjectId = (value) => {
  if (!value) return null;
  const text = String(value?._id || value || '').trim();
  if (!mongoose.Types.ObjectId.isValid(text)) return null;
  return new mongoose.Types.ObjectId(text);
};

const parseDateOnly = (value, endOfDay = false) => {
  const text = String(value || '').trim();
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const pickIpAddress = (req) => String(
  req?.headers?.['x-forwarded-for']?.split?.(',')?.[0]
  || req?.ip
  || req?.socket?.remoteAddress
  || '',
).trim();

class AdminAuditLogService {
  async log({
    req = null,
    actorId,
    action,
    targetType,
    targetId,
    targetLabel = '',
    previousState = {},
    newState = {},
    reason = '',
    metadata = {},
  }) {
    try {
      const actorObjectId = normalizeObjectId(actorId || req?.user?.userId);
      const targetObjectId = normalizeObjectId(targetId);

      if (!actorObjectId || !targetObjectId) return null;
      if (!ACTION_VALUES.includes(action) || !TARGET_TYPE_VALUES.includes(targetType)) return null;

      return await AdminAuditLog.create({
        actor: actorObjectId,
        action,
        targetType,
        targetId: targetObjectId,
        targetLabel: String(targetLabel || '').trim().slice(0, 500),
        previousState: previousState || {},
        newState: newState || {},
        reason: String(reason || '').trim().slice(0, 1000),
        metadata: metadata || {},
        ipAddress: pickIpAddress(req),
        userAgent: String(req?.headers?.['user-agent'] || '').trim().slice(0, 500),
      });
    } catch (error) {
      console.error('[AdminAuditLogService] Cannot create audit log:', error.message || error);
      return null;
    }
  }

  async list(query = {}) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, Number.parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const action = ACTION_VALUES.includes(String(query.action || '').trim()) ? String(query.action).trim() : '';
    const targetType = TARGET_TYPE_VALUES.includes(String(query.targetType || '').trim()) ? String(query.targetType).trim() : '';
    const keyword = String(query.keyword || '').trim();
    const fromDate = parseDateOnly(query.fromDate || query.startDate);
    const toDate = parseDateOnly(query.toDate || query.endDate, true);

    if ((query.fromDate || query.startDate) && !fromDate) {
      throw { status: 400, message: 'Ngày bắt đầu không hợp lệ. Định dạng đúng là YYYY-MM-DD.' };
    }

    if ((query.toDate || query.endDate) && !toDate) {
      throw { status: 400, message: 'Ngày kết thúc không hợp lệ. Định dạng đúng là YYYY-MM-DD.' };
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw { status: 400, message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' };
    }

    const match = {};
    if (action) match.action = action;
    if (targetType) match.targetType = targetType;
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = fromDate;
      if (toDate) match.createdAt.$lte = toDate;
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'actor',
          foreignField: '_id',
          as: 'actorDoc',
        },
      },
      { $unwind: { path: '$actorDoc', preserveNullAndEmptyArrays: true } },
    ];

    if (keyword) {
      const regex = { $regex: escapeRegex(keyword), $options: 'i' };
      pipeline.push({
        $match: {
          $or: [
            { targetLabel: regex },
            { reason: regex },
            { 'actorDoc.fullName': regex },
            { 'actorDoc.email': regex },
          ],
        },
      });
    }

    const [result] = await AdminAuditLog.aggregate([
      ...pipeline,
      {
        $facet: {
          items: [
            { $sort: { createdAt: -1, targetLabel: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                action: 1,
                targetType: 1,
                targetId: 1,
                targetLabel: 1,
                previousState: 1,
                newState: 1,
                reason: 1,
                metadata: 1,
                ipAddress: 1,
                userAgent: 1,
                createdAt: 1,
                updatedAt: 1,
                actor: {
                  _id: '$actorDoc._id',
                  fullName: '$actorDoc.fullName',
                  email: '$actorDoc.email',
                  avatar: '$actorDoc.avatar',
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const total = result?.total?.[0]?.count || 0;

    return {
      logs: result?.items || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: { action, targetType, keyword },
    };
  }
}

export default new AdminAuditLogService();
