import User from '../model/user.model.js';
import SystemSetting from '../model/systemSetting.model.js';
import Post from '../model/post.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';
import notificationService from './notification.service.js';

// ====================================================================
// REPUTATION SERVICE
// Hệ thống điểm danh tiếng IT Forum
// ====================================================================

export const getTodayStart = () => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const vnStartUtc = Date.UTC(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate(),
        0, 0, 0, 0
    );
    // Trừ lại 7 tiếng để ra mốc thời gian UTC tương ứng với 00:00:00 VN
    return new Date(vnStartUtc - 7 * 60 * 60 * 1000);
};

export const getThisWeekStart = () => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = vnTime.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const vnWeekStartUtc = Date.UTC(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate() - diffToMonday,
        0, 0, 0, 0
    );
    return new Date(vnWeekStartUtc - 7 * 60 * 60 * 1000);
};

export const RANKS = [
    { name: 'Newbie',      minRep: 1,    icon: '🌱', color: '#6b7280' },
    { name: 'Member',      minRep: 50,   icon: '🔵', color: '#3b82f6' },
    { name: 'Contributor', minRep: 200,  icon: '🟢', color: '#22c55e' },
    { name: 'Trusted',     minRep: 500,  icon: '🟡', color: '#eab308' },
    { name: 'Expert',      minRep: 1000, icon: '🟠', color: '#f97316' },
    { name: 'Elite',       minRep: 2000, icon: '🔴', color: '#ef4444' },
];

export const getRankInfo = (reputation = 1) => {
    let current = RANKS[0];
    for (const rank of RANKS) {
        if (reputation >= rank.minRep) current = rank;
        else break;
    }
    const idx = RANKS.indexOf(current);
    const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
    return { ...current, next };
};

const DELTA_MAP = {
    post_upvoted: +10,
    post_downvoted: -2,
    downvote_given: -1,
    donate_received: +20,
    post_deleted_by_report: -10,
    comment_deleted_by_report: -5,
    post_upvote_removed: -10,
    post_downvote_removed: +2,
    downvote_given_removed: +1,
    report_submitted: -1,
    report_helpful: +2,
    report_retracted: +1,
    comment_upvoted: +10,
    comment_downvoted: -2,
    comment_downvote_given: -1,
    comment_upvote_removed: -10,
    comment_downvote_removed: +2,
    comment_downvote_given_removed: +1,
    best_answer_accepted: +15,
    best_answer_accepted_removed: -15,
    best_answer_bonus: +2,
    best_answer_bonus_removed: -2,
};

const DAILY_CAP_REASONS = new Set([
    'post_upvoted',
    'post_downvoted',
    'downvote_given',
    'post_upvote_removed',
    'post_downvote_removed',
    'downvote_given_removed',
    'comment_upvoted',
    'comment_downvoted',
    'comment_downvote_given',
    'comment_upvote_removed',
    'comment_downvote_removed',
    'comment_downvote_given_removed',
]);

const safeCreateEngagementNotification = async ({ userId, reason, targetId, voterId }) => {
    try {
        if (reason === 'post_upvoted' || reason === 'post_downvoted') {
            if (!targetId || !voterId || String(userId) === String(voterId)) return;
            const [post, voter] = await Promise.all([
                Post.findById(targetId).select('title author status isAuthorActive').lean(),
                User.findById(voterId).select('fullName email avatar').lean(),
            ]);
            if (!post || !voter) return;
            await notificationService.createPostVoteNotification({
                recipientId: userId,
                sender: voter,
                post,
                voteType: reason === 'post_downvoted' ? 'downvote' : 'upvote',
            });
            return;
        }

        if (reason === 'donate_received' && targetId) {
            const donation = await DonationTransaction.findById(targetId)
                .populate('donor', 'fullName email avatar')
                .populate('post', 'title')
                .lean();
            if (!donation) return;
            await notificationService.createDonationReceivedNotification({
                authorId: userId,
                donor: donation.donor,
                post: donation.post || donation.postSnapshot,
                donation,
            });
        }
    } catch (notificationError) {
        console.error('[ReputationService] Engagement notification failed:', notificationError.message || notificationError);
    }
};

class ReputationService {
    async award(userId, reason, targetId = null, voterId = null) {
        if (!userId || !reason) return;

        const delta = DELTA_MAP[reason];
        if (delta === undefined) return;

        if (reason === 'donate_received' && targetId) {
            const existingDonationAward = await ReputationHistory.findOne({
                user: userId,
                type: reason,
                targetId,
            }).select('_id');

            if (existingDonationAward) return;
        }

        const user = await User.findById(userId);
        if (!user) return;

        let effectiveDelta = delta;

        try {
            if (reason === 'post_upvoted' || reason === 'post_upvote_removed') {
                const setting = await SystemSetting.findOne({ key: 'reputation_upvote_score' });
                if (setting && typeof setting.value === 'number') {
                    const base = setting.value;
                    effectiveDelta = reason === 'post_upvoted' ? base : -base;
                }
            } else if (reason === 'post_downvoted' || reason === 'post_downvote_removed') {
                const setting = await SystemSetting.findOne({ key: 'reputation_downvote_score' });
                if (setting && typeof setting.value === 'number') {
                    const base = setting.value;
                    effectiveDelta = reason === 'post_downvoted' ? base : -base;
                }
            }
        } catch (err) {
            console.error('[ReputationService] Error fetching dynamic reputation delta:', err);
        }

        const retractionMap = {
            post_upvote_removed: 'post_upvoted',
            post_downvote_removed: 'post_downvoted',
            downvote_given_removed: 'downvote_given',
            comment_upvote_removed: 'comment_upvoted',
            comment_downvote_removed: 'comment_downvoted',
            comment_downvote_given_removed: 'comment_downvote_given',
        };

        const matchingType = retractionMap[reason];
        let originalLog = null;

        if (matchingType && targetId && voterId) {
            try {
                originalLog = await ReputationHistory.findOne({
                    user: userId,
                    type: matchingType,
                    targetId,
                    voter: voterId,
                }).sort({ createdAt: -1 });

                if (originalLog) {
                    effectiveDelta = -originalLog.reputationEarned;
                }
            } catch (err) {
                console.error('[ReputationService] Error searching original reputation log for retraction:', err);
            }
        }

        if (DAILY_CAP_REASONS.has(reason)) {
            let dailyCap = 200;
            try {
                const setting = await SystemSetting.findOne({ key: 'reputation_daily_cap' });
                if (setting && typeof setting.value === 'number') {
                    dailyCap = setting.value;
                }
            } catch (err) {
                console.error('[ReputationService] Error fetching reputation_daily_cap:', err);
            }

            const todayStart = getTodayStart();
            const sameDay = user.reputationDailyDate &&
                new Date(user.reputationDailyDate).getTime() === todayStart.getTime();
            const earned = sameDay ? (user.reputationDailyEarned || 0) : 0;

            if (reason === 'post_upvoted' || reason === 'comment_upvoted') {
                const remaining = dailyCap - earned;
                if (remaining <= 0) {
                    effectiveDelta = 0;
                } else {
                    effectiveDelta = Math.min(effectiveDelta, remaining);
                }
            }

            let dailyEarnedDiff = 0;
            if (reason === 'post_upvoted' || reason === 'comment_upvoted') {
                dailyEarnedDiff = effectiveDelta;
            } else if ((reason === 'post_upvote_removed' || reason === 'comment_upvote_removed') && originalLog) {
                const originalLogDate = new Date(originalLog.createdAt);
                const isOriginalToday = originalLogDate.getTime() >= todayStart.getTime();
                if (isOriginalToday) {
                    dailyEarnedDiff = effectiveDelta;
                }
            }

            const newEarned = Math.max(0, earned + dailyEarnedDiff);
            const newReputation = Math.max(1, (user.reputation || 1) + effectiveDelta);

            await User.findByIdAndUpdate(userId, {
                $set: {
                    reputation: newReputation,
                    reputationDailyEarned: newEarned,
                    reputationDailyDate: sameDay ? user.reputationDailyDate : todayStart,
                },
            });
        } else if (effectiveDelta !== 0) {
            const newReputation = Math.max(1, (user.reputation || 1) + effectiveDelta);
            await User.findByIdAndUpdate(userId, { $set: { reputation: newReputation } });
        }

        if (effectiveDelta !== 0 || reason === 'post_upvoted' || reason === 'comment_upvoted' || ((reason === 'post_upvote_removed' || reason === 'comment_upvote_removed') && originalLog && originalLog.reputationEarned === 0)) {
            try {
                let title = 'Biến động uy tín';

                if (reason === 'donate_received' && targetId) {
                    const donation = await DonationTransaction.findById(targetId).populate('donor', 'fullName');
                    title = `Ủng hộ từ ${donation?.donorSnapshot?.fullName || donation?.donor?.fullName || 'Người ẩn danh'}`;
                } else if (targetId) {
                    const post = await Post.findById(targetId).select('title');
                    title = post ? post.title : 'Bài viết đã ẩn/xóa';
                }

                if (reason === 'comment_deleted_by_report') {
                    title = `Bình luận bị xóa do vi phạm: ${title}`;
                } else if (reason === 'post_deleted_by_report') {
                    title = `Bài viết bị xóa do vi phạm: ${title}`;
                } else if (reason === 'post_upvoted' && effectiveDelta === 0) {
                    title = `[Đạt giới hạn ngày] ${title}`;
                } else if (reason === 'comment_upvoted' && effectiveDelta === 0) {
                    title = `[Đạt giới hạn ngày] Bình luận: ${title}`;
                } else if (reason === 'post_upvote_removed') {
                    title = `Huỷ upvote: ${title}`;
                } else if (reason === 'post_downvote_removed') {
                    title = `Huỷ downvote: ${title}`;
                } else if (reason === 'downvote_given_removed') {
                    title = 'Hoàn điểm downvote đã gửi';
                } else if (reason === 'downvote_given') {
                    title = 'Đã gửi downvote cho bài viết';
                } else if (reason === 'comment_upvoted') {
                    title = `Bình luận được upvote: ${title}`;
                } else if (reason === 'comment_downvoted') {
                    title = `Bình luận bị downvote: ${title}`;
                } else if (reason === 'comment_upvote_removed') {
                    title = `Hủy upvote bình luận: ${title}`;
                } else if (reason === 'comment_downvote_removed') {
                    title = `Hủy downvote bình luận: ${title}`;
                } else if (reason === 'comment_downvote_given') {
                    title = 'Đã gửi downvote cho bình luận';
                } else if (reason === 'comment_downvote_given_removed') {
                    title = 'Hoàn điểm downvote bình luận đã gửi';
                } else if (reason === 'best_answer_accepted') {
                    title = `Câu trả lời được chọn tốt nhất: ${title}`;
                } else if (reason === 'best_answer_accepted_removed') {
                    title = `Hủy chọn câu trả lời tốt nhất: ${title}`;
                } else if (reason === 'best_answer_bonus') {
                    title = `Thưởng chấp nhận câu trả lời tốt nhất: ${title}`;
                } else if (reason === 'best_answer_bonus_removed') {
                    title = `Hủy điểm thưởng chấp nhận câu trả lời tốt nhất: ${title}`;
                } else if (reason === 'report_submitted') {
                    title = `Gửi báo cáo vi phạm: ${title}`;
                } else if (reason === 'report_helpful') {
                    title = `Báo cáo vi phạm hợp lệ (thưởng uy tín): ${title}`;
                } else if (reason === 'report_retracted') {
                    title = `Hoàn điểm gửi báo cáo (đã rút cờ): ${title}`;
                }

                await ReputationHistory.create({
                    user: userId,
                    type: reason,
                    title,
                    reputationEarned: effectiveDelta,
                    targetId,
                    voter: voterId,
                });
            } catch (historyErr) {
                console.error('[ReputationService] Error logging reputation history:', historyErr);
            }
        }

        if (reason === 'post_upvoted' || reason === 'post_downvoted' || reason === 'donate_received') {
            await safeCreateEngagementNotification({ userId, reason, targetId, voterId });
        }
    }

    async getReputationInfo(userId) {
        const user = await User.findById(userId).select('reputation fullName avatar');
        if (!user) return null;
        const rep = user.reputation || 1;
        return {
            reputation: rep,
            ...getRankInfo(rep),
        };
    }
}

export default new ReputationService();