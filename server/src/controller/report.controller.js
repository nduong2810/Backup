import reportService from '../service/report.service.js';

class ReportController {
  async createTicket(req, res) {
    try {
      const { postId, flagType, details = '' } = req.body;
      if (!postId || !flagType) {
        return res.status(400).json({ success: false, message: 'postId và flagType là bắt buộc.' });
      }

      const ticket = await reportService.createReportTicket(postId, req.user.userId, flagType, details.trim());
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
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công.', data: ticket });
    } catch (error) {
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server.' });
    }
  }
}

export default new ReportController();
