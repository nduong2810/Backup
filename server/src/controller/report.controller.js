import reportService from '../service/report.service.js';
import notificationService from '../service/notification.service.js';

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value?.toString === 'function') return value.toString();
  return '';
};

const getDocId = (value) => getId(value?._id || value);

const safeNotifyReportOutcome = async ({ ticket, adminId, note }) => {
  try {
    const reporterId = getDocId(ticket?.reporter);
    const postId = getDocId(ticket?.post);
    if (!reporterId || !postId || !adminId) return;

    await notificationService.createReportOutcomeNotification({
      reporterId,
      adminId,
      post: postId,
      report: ticket,
      status: ticket.status,
      note,
    });
  } catch (error) {
    console.error('[ReportController] create report outcome notification failed:', error.message || error);
  }
};

class ReportController {
  async createTicket(req, res) {
    try {
      const { postId, commentId, flagType, details = '' } = req.body;
      if ((!postId && !commentId) || !flagType) {
        return res.status(400).json({ success: false, message: 'postId hoặc commentId, cùng với flagType là bắt buộc.' });
      }

      const ticket = await reportService.createReportTicket({ postId, commentId, flagType, details: details.trim() }, req.user.userId);
      return res.status(201).json({ success: true, message: 'Gửi cờ báo cáo thành công.', data: ticket });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }

  async getMyTickets(req, res) {
    try {
      const tickets = await reportService.getMyReportTickets(req.user.userId);
      return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }

  async getAllFlagsForAdmin(req, res) {
    try {
      const tickets = await reportService.getAllFlagsForAdmin(req.query);
      return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }

  async getPostSummaryForOwner(req, res) {
    try {
      const data = await reportService.getPostFlagSummaryForOwner(
        req.params.postId,
        req.user.userId,
        req.user.role,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }

  async retractFlag(req, res) {
    try {
      const ticket = await reportService.retractFlag(req.params.ticketId, req.user.userId);
      return res.status(200).json({ success: true, message: 'Đã rút cờ báo cáo.', data: ticket });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }

  async adminTransition(req, res) {
    try {
      const { nextStatus, note = '' } = req.body;
      if (!nextStatus) {
        return res.status(400).json({ success: false, message: 'nextStatus là bắt buộc.' });
      }
      const ticket = await reportService.adminTransition(req.params.ticketId, nextStatus, req.user.userId, note);
      await safeNotifyReportOutcome({ ticket, adminId: req.user.userId, note });
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công.', data: ticket });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }
}

export default new ReportController();