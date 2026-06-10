import statisticsService from '../service/statistics.service.js';

// ====================================================================
// STATISTICS CONTROLLER - API thống kê hoạt động user
// ====================================================================

class StatisticsController {
    /**
     * GET /user/statistics
     * Lấy toàn bộ thống kê cho user đang đăng nhập
     */
    async getMyStatistics(req, res) {
        try {
            const months = parseInt(req.query.months) || 12;
            const clampedMonths = Math.min(Math.max(months, 1), 24);

            const statistics = await statisticsService.getUserStatistics(
                req.user.userId,
                clampedMonths
            );

            res.status(200).json({
                success: true,
                data: statistics,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Không thể tải thống kê',
            });
        }
    }
}

export default new StatisticsController();
