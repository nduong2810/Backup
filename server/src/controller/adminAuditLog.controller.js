import adminAuditLogService from '../service/adminAuditLog.service.js';

class AdminAuditLogController {
  async list(req, res) {
    try {
      const result = await adminAuditLogService.list(req.query);
      return res.status(200).json({
        success: true,
        message: 'Lấy nhật ký quản trị thành công',
        data: result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tải nhật ký quản trị',
      });
    }
  }
}

export default new AdminAuditLogController();
