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
            reactionsGiven,
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
            statisticsRepository.getReactionsGiven(userId),
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
            reactionsGiven,
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

    async getUserPostsPaginated(userId, page = 1, limit = 10, sortBy = 'newest', timeRange = 'all') {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            statisticsRepository.getRecentPosts(userId, limitNum, skip, sortBy, timeRange),
            statisticsRepository.countUserPosts(userId, timeRange),
        ]);

        return {
            posts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        };
    }

    async getUserCommentsPaginated(userId, page = 1, limit = 10, sortBy = 'newest', timeRange = 'all') {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [comments, total] = await Promise.all([
            statisticsRepository.getRecentComments(userId, limitNum, skip, sortBy, timeRange),
            statisticsRepository.countUserComments(userId, timeRange),
        ]);

        return {
            comments,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        };
    }

    async getUserVotesPaginated(userId, page = 1, limit = 10, sortBy = 'newest', timeRange = 'all') {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [votes, total] = await Promise.all([
            statisticsRepository.getRecentVotes(userId, limitNum, skip, sortBy, timeRange),
            statisticsRepository.countUserVotes(userId, timeRange),
        ]);

        return {
            votes,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        };
    }


    async getUserReputationPaginated(userId, page = 1, limit = 10) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [changes, total] = await Promise.all([
            statisticsRepository.getReputationChangesPaginated(userId, limitNum, skip),
            statisticsRepository.countReputationChanges(userId),
        ]);

        return {
            changes,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        };
    }

}

export default new StatisticsService();
