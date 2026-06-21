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

    async getMyPostsPaginated(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const sortBy = req.query.sortBy || 'newest';
            const timeRange = req.query.timeRange || 'all';

            const result = await statisticsService.getUserPostsPaginated(
                req.user.userId,
                page,
                limit,
                sortBy,
                timeRange
            );

            res.status(200).json({
                success: true,
                data: result.posts,
                pagination: result.pagination,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Không thể tải danh sách bài viết',
            });
        }
    }


    async getMyCommentsPaginated(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const sortBy = req.query.sortBy || 'newest';
            const timeRange = req.query.timeRange || 'all';

            const result = await statisticsService.getUserCommentsPaginated(
                req.user.userId,
                page,
                limit,
                sortBy,
                timeRange
            );

            res.status(200).json({
                success: true,
                data: result.comments,
                pagination: result.pagination,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Không thể tải danh sách bình luận',
            });
        }
    }


    async getMyVotesPaginated(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const sortBy = req.query.sortBy || 'newest';
            const timeRange = req.query.timeRange || 'all';

            const result = await statisticsService.getUserVotesPaginated(
                req.user.userId,
                page,
                limit,
                sortBy,
                timeRange
            );

            res.status(200).json({
                success: true,
                data: result.votes,
                pagination: result.pagination,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Không thể tải danh sách tương tác',
            });
        }
    }


    async getMyReputationPaginated(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;

            const result = await statisticsService.getUserReputationPaginated(
                req.user.userId,
                page,
                limit
            );

            res.status(200).json({
                success: true,
                data: result.changes,
                pagination: result.pagination,
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Không thể tải lịch sử uy tín',
            });
        }
    }

}

export default new StatisticsController();
