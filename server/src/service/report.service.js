import reportRepository from '../repository/report.repository.js';
import postRepository from '../repository/post.repository.js';
import userRepository from '../repository/user.repository.js';
import reputationService from './reputation.service.js';
import SystemSetting from '../model/systemSetting.model.js';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MIN_REPUTATION_TO_REPORT = 15;

const FLAG_LABELS = {
  spam: 'Xóa vì spam quảng cáo hàng loạt',
  rude_abusive: 'Xóa vì công kích/xúc phạm',
  off_topic: 'Không đúng chủ đề cộng đồng',
  needs_detail: 'Cần thêm chi tiết hoặc làm rõ',
  needs_focus: 'Cần tập trung vào một vấn đề cụ thể',
  opinion_based: 'Dựa trên quan điểm cá nhân',
  duplicate: 'Trùng câu hỏi/bài viết đã có',
  very_low_quality: 'Chất lượng rất thấp, khó cứu vãn',
  moderator_attention: 'Cần moderator xem thủ công',
};

const STATUS_LABELS = {
  submitted: 'Mới gửi',
  received: 'Đã tiếp nhận',
  in_review: 'Đang xem xét',
  action_taken: 'Đã xử lý vi phạm',
  closed: 'Đã đóng (không xử lý)',
  retracted: 'Đã rút cờ',
};

const AUTO_DELETE_TYPES = ['spam', 'rude_abusive'];
const OPEN_STATUSES = ['submitted', 'received', 'in_review'];
const ADMIN_TRANSITION_MAP = {
  received: ['in_review'],
  in_review: ['action_taken', 'closed'],
};

const normalizeFlag = (ticket) => {
  if (!ticket) return ticket;
  const obj = ticket.toObject ? ticket.toObject() : ticket;

  if (obj.status === 'submitted') {
    const elapsed = Date.now() - new Date(obj.createdAt).getTime();
    if (elapsed >= THIRTY_MINUTES_MS) {
      obj.status = 'received';
      obj.derivedStatus = true;
    }
  }

  obj.flagTypeLabel = FLAG_LABELS[obj.flagType] || obj.flagType;
  obj.statusLabel = STATUS_LABELS[obj.status] || obj.status;
  obj.retractable = OPEN_STATUSES.includes(obj.status);

  return obj;
};

class ReportService {
  async createReportTicket(postId, reporterId, flagType, details = '') {
    const reporter = await userRepository.findById(reporterId);
    if (!reporter) {
      throw { status: 404, message: 'Không tìm thấy người dùng.' };
    }

    if (reporter.role !== 'admin') {
      const reputation = reporter.reputation || 1;
      if (reputation < MIN_REPUTATION_TO_REPORT) {
        throw {
          status: 403,
          message: `Bạn cần tối thiểu ${MIN_REPUTATION_TO_REPORT} điểm uy tín để gửi cờ báo cáo.`,
        };
      }
    }

    const post = await postRepository.findById(postId);
    if (!post || post.status === 'deleted') {
      throw { status: 404, message: 'Bài viết không tồn tại hoặc đã bị xóa.' };
    }

    const existing = await reportRepository.findExistingFlag(postId, reporterId, flagType);
    if (existing) {
      throw { status: 409, message: 'Bạn đã từng gửi loại cờ này cho bài viết này, không thể gửi lại.' };
    }

    const ticket = await reportRepository.create({
      post: postId,
      reporter: reporterId,
      flagType,
      details,
      status: 'submitted',
      outcome: 'pending',
      history: [{
        status: 'submitted',
        note: `Người dùng gửi cờ: ${FLAG_LABELS[flagType] || flagType}.`,
        actorRole: 'user',
        actor: reporterId,
      }],
    });

    if (AUTO_DELETE_TYPES.includes(flagType)) {
      let autoDeleteThreshold = 4;
      try {
        const setting = await SystemSetting.findOne({ key: 'flag_auto_hide_threshold' });
        if (setting && typeof setting.value === 'number') {
          autoDeleteThreshold = setting.value;
        }
      } catch (err) {
        console.error('[ReportService] Error fetching flag_auto_hide_threshold:', err);
      }

      const count = await reportRepository.countActiveByFlagType(postId, flagType);
      if (count >= autoDeleteThreshold) {
        await postRepository.setDeletedStatus(postId);
        await reportRepository.bulkMarkActionTakenByPost(
          postId,
          `Tự động xử lý: bài viết bị xóa khi đủ ${autoDeleteThreshold} cờ ${FLAG_LABELS[flagType]}.`,
        );
        // Trừ reputation tác giả khi bài bị xóa do report
        const deletedPost = await postRepository.findById(postId);
        const authorId = deletedPost?.author?._id?.toString() || deletedPost?.author?.toString();
        if (authorId) await reputationService.award(authorId, 'post_deleted_by_report', postId);
      }
    }

    const updated = await reportRepository.findById(ticket._id);
    return normalizeFlag(updated);
  }

  async getMyReportTickets(userId) {
    const tickets = await reportRepository.findByReporter(userId);
    return tickets.map((ticket) => normalizeFlag(ticket));
  }

  async getAllFlagsForAdmin(query = {}) {
    const { status = '', flagType = '' } = query;
    const tickets = await reportRepository.findForAdmin({ status, flagType });
    return tickets.map((ticket) => normalizeFlag(ticket));
  }

  async getPostFlagSummaryForOwner(postId, requesterId, requesterRole) {
    const post = await postRepository.findById(postId);
    if (!post) throw { status: 404, message: 'Không tìm thấy bài viết.' };

    const isOwner = post.author?._id?.toString() === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw { status: 403, message: 'Bạn không có quyền xem tổng hợp cờ của bài viết này.' };
    }

    const flags = await reportRepository.findByPostForOwner(postId);
    const summaryByType = flags.reduce((acc, item) => {
      const key = item.flagType;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      postId,
      postTitle: post.title,
      postStatus: post.status,
      totalFlags: flags.length,
      summaryByType,
      flags: flags.map((item) => normalizeFlag(item)),
    };
  }

  async retractFlag(ticketId, userId) {
    const ticket = await reportRepository.findById(ticketId);
    if (!ticket) throw { status: 404, message: 'Không tìm thấy cờ báo cáo.' };
    if (ticket.reporter?._id?.toString() !== userId) {
      throw { status: 403, message: 'Bạn không có quyền rút cờ này.' };
    }

    const normalized = normalizeFlag(ticket);
    if (!OPEN_STATUSES.includes(normalized.status)) {
      throw { status: 400, message: 'Cờ đã được xử lý, không thể rút.' };
    }

    const updated = await reportRepository.updateById(ticketId, {
      $set: { status: 'retracted', outcome: 'retracted' },
      $push: {
        history: {
          status: 'retracted',
          note: 'Người dùng đã rút cờ khi cờ còn đang chờ xử lý.',
          actorRole: 'user',
          actor: userId,
        },
      },
    });

    return normalizeFlag(updated);
  }

  async adminTransition(ticketId, nextStatus, adminUserId, note = '') {
    const ticket = await reportRepository.findById(ticketId);
    if (!ticket) throw { status: 404, message: 'Không tìm thấy cờ báo cáo.' };

    const allowedStatuses = ['received', 'in_review', 'action_taken', 'closed'];
    if (!allowedStatuses.includes(nextStatus)) {
      throw { status: 400, message: 'Trạng thái admin cập nhật không hợp lệ.' };
    }

    const normalized = normalizeFlag(ticket);
    if (!OPEN_STATUSES.includes(normalized.status)) {
      throw { status: 400, message: 'Cờ đã kết thúc xử lý (đã rút/đã đóng/đã xử lý), không thể đổi trạng thái.' };
    }

    const allowedNextStatuses = ADMIN_TRANSITION_MAP[normalized.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      throw {
        status: 400,
        message: `Không thể chuyển từ "${STATUS_LABELS[normalized.status] || normalized.status}" sang "${STATUS_LABELS[nextStatus] || nextStatus}".`,
      };
    }

    const outcome = nextStatus === 'action_taken'
      ? 'helpful'
      : nextStatus === 'closed'
        ? 'declined'
        : ticket.outcome;

    const updated = await reportRepository.updateById(ticketId, {
      $set: { status: nextStatus, outcome },
      $push: {
        history: {
          status: nextStatus,
          note: note || `Admin cập nhật trạng thái: ${STATUS_LABELS[nextStatus]}.`,
          actorRole: 'admin',
          actor: adminUserId,
        },
      },
    });

    return normalizeFlag(updated);
  }
}

export default new ReportService();
