import statisticsRepository from '../repository/statistics.repository.js';
import { getRankInfo } from './reputation.service.js';
import User from '../model/user.model.js';

// ====================================================================
// STATISTICS SERVICE - Tổng hợp thống kê hoạt động user
// ====================================================================

class StatisticsService {

    /**
     * Lấy toàn bộ thống kê hoạt động cho user
     * @param {string} userId
     * @param {number} months - Số tháng cho timeline (mặc định 12)
     */
    async getUserStatistics(userId, months = 12) {
        // Gọi song song tất cả queries để tối ưu hiệu suất
        const [
            user,
            postStats,
            commentStats,
            postTimeline,
            commentTimeline,
            topTags,
            topPosts,
            donationStats,
            recentPosts,
            recentComments,
            votesGiven,
            reputationChanges,
        ] = await Promise.all([
            User.findById(userId).select('reputation createdAt fullName'),
            statisticsRepository.getPostStats(userId),
            statisticsRepository.getCommentStats(userId),
            statisticsRepository.getPostTimeline(userId, months),
            statisticsRepository.getCommentTimeline(userId, months),
            statisticsRepository.getTopTags(userId, 10),
            statisticsRepository.getTopPosts(userId, 5),
            statisticsRepository.getDonationStats(userId),
            statisticsRepository.getRecentPosts(userId, 10),
            statisticsRepository.getRecentComments(userId, 10),
            statisticsRepository.getVotesGiven(userId),
            statisticsRepository.getReputationChanges(userId, 5),
        ]);

        if (!user) {
            const err = new Error('Không tìm thấy người dùng');
            err.status = 404;
            throw err;
        }

        // Merge post & comment timeline thành 1 dataset cho chart
        const timeline = this._mergeTimelines(postTimeline, commentTimeline, months);

        // Tính ngày tham gia
        const memberSince = user.createdAt;
        const reputation = user.reputation || 1;
        const rankInfo = getRankInfo(reputation);

        return {
            summary: {
                totalPosts: postStats.total,
                postsByType: postStats.byType,
                postsByStatus: postStats.byStatus,
                totalViews: postStats.totalViews,
                totalUpvotes: postStats.totalUpvotes,
                totalDownvotes: postStats.totalDownvotes,
                totalComments: commentStats.total,
                totalCommentLikes: commentStats.totalLikes,
                reputation,
                rankInfo,
                memberSince,
                donations: donationStats,
            },
            timeline,
            topTags,
            topPosts,
            recentPosts,
            recentComments,
            votesGiven,
            reputationChanges,
        };
    }

    /**
     * Merge post timeline và comment timeline thành 1 array
     * Đảm bảo có đủ tất cả tháng (kể cả tháng không có hoạt động)
     */
    _mergeTimelines(postTimeline, commentTimeline, months) {
        const now = new Date();
        const result = [];

        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1; // JS months are 0-indexed

            const postEntry = postTimeline.find(
                (t) => t.year === year && t.month === month
            );
            const commentEntry = commentTimeline.find(
                (t) => t.year === year && t.month === month
            );

            result.push({
                year,
                month,
                label: `T${month}/${year}`,
                posts: postEntry?.count || 0,
                comments: commentEntry?.count || 0,
            });
        }

        return result;
    }
}

export default new StatisticsService();
