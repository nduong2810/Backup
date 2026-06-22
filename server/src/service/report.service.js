import reportRepository from '../repository/report.repository.js';
import postRepository from '../repository/post.repository.js';
import userRepository from '../repository/user.repository.js';
import commentRepository from '../repository/comment.repository.js';
import Comment from '../model/comment.model.js';
import ReportTicket from '../model/reportTicket.model.js';
import reputationService from './reputation.service.js';
import SystemSetting from '../model/systemSetting.model.js';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MIN_REPUTATION_TO_REPORT = 15;

const FLAG_LABELS = {
  spam: 'Spam quảng cáo hoặc nội dung rác',
  rude_abusive: 'Ngôn từ công kích, quấy rối hoặc thô tục',
  off_topic: 'Lạc đề, không mang tính chất thảo luận học tập',
  needs_detail: 'Cần thêm chi tiết hoặc làm rõ',
  needs_focus: 'Cần tập trung vào một vấn đề cụ thể',
  opinion_based: 'Dựa trên quan điểm cá nhân',
  duplicate: 'Trùng câu hỏi/bài viết đã có',
  very_low_quality: 'Chất lượng rất thấp, khó cứu vãn',
  moderator_attention: 'Cần moderator xem thủ công',
  copyright_infringement: 'Chia sẻ tài liệu lậu, leak khóa học hoặc vi phạm bản quyền',
  false_info_scam: 'Thông tin sai sự thật, lừa đảo hoặc gian lận',
  adult_content: 'Hình ảnh hoặc nội dung nhạy cảm, 18+',
  dont_want_to_see: 'Tôi không muốn nhìn thấy nội dung này',
};

const STATUS_LABELS = {
  submitted: 'Mới gửi',
  received: 'Đã tiếp nhận',
  action_taken: 'Đã xử lý vi phạm',
  closed: 'Đã đóng (không xử lý)',
  retracted: 'Đã rút cờ',
};

const AUTO_DELETE_TYPES = ['spam', 'rude_abusive'];
const OPEN_STATUSES = ['submitted', 'received'];
const ADMIN_TRANSITION_MAP = {
  submitted: ['action_taken', 'closed'],
  received: ['action_taken', 'closed'],
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
  obj.retractable = obj.status === 'submitted';

  return obj;
};

class ReportService {
  async createReportTicket(payload, reporterId) {
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

    // Support legacy (postId, reporterId, flagType, details) signature if payload is just postId
    let postId = payload.postId;
    let commentId = payload.commentId;
    let flagType = payload.flagType;
    let details = payload.details || '';

    if (typeof payload === 'string') {
      postId = arguments[0];
      reporterId = arguments[1];
      flagType = arguments[2];
      details = arguments[3] || '';
    }

    if (commentId) {
      const comment = await commentRepository.findById(commentId);
      if (!comment) {
        throw { status: 404, message: 'Bình luận không tồn tại hoặc đã bị xóa.' };
      }

      if (String(comment.author?._id || comment.author) === String(reporterId)) {
        throw { status: 400, message: 'Bạn không thể tự báo cáo bình luận của chính mình.' };
      }

      const resolvedPostId = comment.post?._id || comment.post;
      const post = await postRepository.findById(resolvedPostId);
      if (!post || post.status === 'deleted') {
        throw { status: 404, message: 'Bài viết chứa bình luận không tồn tại hoặc đã bị xóa.' };
      }

      const existing = await reportRepository.findExistingCommentFlag(commentId, reporterId, flagType);
      if (existing) {
        throw { status: 409, message: 'Bạn đã từng gửi loại cờ này cho bình luận này, không thể gửi lại.' };
      }

      const ticket = await reportRepository.create({
        post: resolvedPostId,
        comment: commentId,
        commentContentSnapshot: comment.content,
        reporter: reporterId,
        flagType,
        details,
        status: 'submitted',
        outcome: 'pending',
        history: [{
          status: 'submitted',
          note: `Người dùng gửi cờ báo cáo bình luận: ${FLAG_LABELS[flagType] || flagType}.`,
          actorRole: 'user',
          actor: reporterId,
        }],
      });

      await reputationService.award(reporterId, 'report_submitted', resolvedPostId);

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

        const count = await reportRepository.countActiveCommentByFlagType(commentId, flagType);
        if (count >= autoDeleteThreshold) {
          await Comment.findByIdAndUpdate(commentId, {
            $set: {
              content: '[Bình luận bị xóa vì không phù hợp]',
              images: [],
              videos: [],
              likes: [],
              dislikes: []
            }
          });

          const activeReports = await ReportTicket.find({
            comment: commentId,
            status: { $in: ['submitted', 'received'] },
          });
          for (const rep of activeReports) {
            const repId = rep.reporter?._id || rep.reporter;
            if (repId) {
              await reputationService.award(repId.toString(), 'report_helpful', resolvedPostId);
            }
          }

          await reportRepository.bulkMarkActionTakenByComment(
            commentId,
            `Tự động xử lý: bình luận bị ẩn khi đủ ${autoDeleteThreshold} cờ ${FLAG_LABELS[flagType]}.`,
          );

          const commentAuthorId = comment.author?._id || comment.author;
          if (commentAuthorId) {
            await reputationService.award(
              commentAuthorId.toString(),
              'comment_deleted_by_report',
              resolvedPostId
            );
          }
        }
      }

      const updated = await reportRepository.findById(ticket._id);
      return normalizeFlag(updated);
    } else {
      const post = await postRepository.findById(postId);
      if (!post || post.status === 'deleted') {
        throw { status: 404, message: 'Bài viết không tồn tại hoặc đã bị xóa.' };
      }

      if (String(post.author?._id || post.author) === String(reporterId)) {
        throw { status: 400, message: 'Bạn không thể tự báo cáo bài viết của chính mình.' };
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

      await reputationService.award(reporterId, 'report_submitted', postId);

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

          const activeReports = await ReportTicket.find({
            post: postId,
            status: { $in: ['submitted', 'received'] },
            comment: { $exists: false }
          });
          for (const rep of activeReports) {
            const repId = rep.reporter?._id || rep.reporter;
            if (repId) {
              await reputationService.award(repId.toString(), 'report_helpful', postId);
            }
          }

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
    if (normalized.status !== 'submitted') {
      throw { status: 400, message: 'Cờ đã được tiếp nhận hoặc đã xử lý, không thể rút.' };
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

    await reputationService.award(userId, 'report_retracted', ticket.post?._id || ticket.post);

    return normalizeFlag(updated);
  }

  async adminTransition(ticketId, nextStatus, adminUserId, note = '') {
    const ticket = await reportRepository.findById(ticketId);
    if (!ticket) throw { status: 404, message: 'Không tìm thấy cờ báo cáo.' };

    const allowedStatuses = ['action_taken', 'closed'];
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

    if (nextStatus === 'action_taken') {
      if (ticket.comment) {
        const commentId = ticket.comment._id || ticket.comment;
        await Comment.findByIdAndUpdate(commentId, {
          $set: {
            content: '[Bình luận bị xóa vì không phù hợp]',
            images: [],
            videos: [],
            likes: [],
            dislikes: []
          }
        });

        // Trừ reputation của tác giả bình luận
        const commentAuthorId = ticket.comment?.author?._id || ticket.comment?.author;
        if (commentAuthorId) {
          await reputationService.award(
            commentAuthorId.toString(),
            'comment_deleted_by_report',
            ticket.post?._id || ticket.post
          );
        }

        // Tự động giải quyết các cờ active khác của bình luận này
        const activeReports = await ReportTicket.find({
          comment: commentId,
          status: { $in: ['submitted', 'received'] },
        });
        for (const rep of activeReports) {
          const repId = rep.reporter?._id || rep.reporter;
          if (repId && repId.toString() !== ticket.reporter?._id?.toString() && repId.toString() !== ticket.reporter?.toString()) {
            await reputationService.award(repId.toString(), 'report_helpful', ticket.post?._id || ticket.post);
          }
        }

        await reportRepository.bulkMarkActionTakenByComment(
          commentId,
          note || `Admin xử lý vi phạm bình luận.`
        );
      } else {
        const postId = ticket.post?._id || ticket.post;
        if (postId) {
          // 1. Đánh dấu bài viết là deleted
          await postRepository.setDeletedStatus(postId);

          // 2. Trừ reputation của tác giả bài viết
          const postObj = await postRepository.findById(postId);
          const authorId = postObj?.author?._id?.toString() || postObj?.author?.toString();
          if (authorId) {
            await reputationService.award(
              authorId,
              'post_deleted_by_report',
              postId
            );
          }

          // Tự động giải quyết các cờ active khác của bài viết này
          const activeReports = await ReportTicket.find({
            post: postId,
            status: { $in: ['submitted', 'received'] },
            comment: { $exists: false }
          });
          for (const rep of activeReports) {
            const repId = rep.reporter?._id || rep.reporter;
            if (repId && repId.toString() !== ticket.reporter?._id?.toString() && repId.toString() !== ticket.reporter?.toString()) {
              await reputationService.award(repId.toString(), 'report_helpful', postId);
            }
          }

          await reportRepository.bulkMarkActionTakenByPost(
            postId,
            note || `Admin xử lý vi phạm bài viết.`
          );
        }
      }
    }

    if (nextStatus === 'action_taken') {
      const reporterId = ticket.reporter?._id || ticket.reporter;
      if (reporterId) {
        await reputationService.award(
          reporterId.toString(),
          'report_helpful',
          ticket.post?._id || ticket.post
        );
      }
    }

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
