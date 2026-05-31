import reputationService, { getRankInfo } from '../service/reputation.service.js';
import User from '../model/user.model.js';

class ReputationController {
    /**
     * GET /api/reputation/users/:userId
     * Lấy điểm reputation + rank của một user cụ thể (public)
     */
    async getUserReputation(req, res) {
        try {
            const { userId } = req.params;
            const info = await reputationService.getReputationInfo(userId);
            if (!info) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
            return res.status(200).json({ success: true, data: info });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
        }
    }

    /**
     * GET /api/reputation/me
     * Lấy điểm reputation + rank của user hiện tại (auth required)
     */
    async getMyReputation(req, res) {
        try {
            const userId = req.user.userId;
            const info = await reputationService.getReputationInfo(userId);
            if (!info) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
            return res.status(200).json({ success: true, data: info });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
        }
    }
}

export default new ReputationController();
