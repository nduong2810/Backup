import User from '../model/user.model.js';
import SystemSetting from '../model/systemSetting.model.js';
import Post from '../model/post.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';

// ====================================================================
// REPUTATION SERVICE
// Hệ thống điểm danh tiếng IT Forum — chỉ áp dụng cho upvote/downvote bài viết
// ====================================================================

const VN_TZ_OFFSET_MIN = 7 * 60;

export const getTodayStart = () => {
    const now = new Date();
    // Cộng 7 tiếng để ra giờ VN
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    // Tạo mốc 00:00:00 của ngày VN bằng UTC
    const vnStartUtc = Date.UTC(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate(),
        0, 0, 0, 0
    );
    // Trừ lại 7 tiếng để ra mốc thời gian UTC tương ứng với 00:00:00 VN
};

export const getThisWeekStart = () => {
    const now = new Date();
    // Cộng 7 tiếng để ra giờ VN
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = vnTime.getUTCDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
    const diffToMonday = day === 0 ? 6 : day - 1;
    
    // Tạo mốc 00:00:00 Thứ Hai đầu tuần VN bằng UTC
    const vnWeekStartUtc = Date.UTC(
        vnTime.getUTCFullYear(),
        vnTime.getUTCMonth(),
        vnTime.getUTCDate() - diffToMonday,
        0, 0, 0, 0
    );
    // Trừ lại 7 tiếng để ra mốc thời gian UTC tương ứng với 00:00:00 VN của Thứ Hai
    return new Date(vnWeekStartUtc - 7 * 60 * 60 * 1000);
};

// ====================================================================
// RANK CONFIG
// ====================================================================
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

// ====================================================================
// AWARD REPUTATION
// reasons: 'post_upvoted' (+10) | 'post_downvoted' (-2) | 'downvote_given' (-1)
//          | 'donate_received' (+20) | 'post_deleted_by_report' (-10)
// subjectTodailyCap: true chỉ áp dụng cho upvote/downvote (giới hạn 200đ/ngày)
// ====================================================================
const DELTA_MAP = {
    post_upvoted:          +10,
    post_downvoted:        -2,
    downvote_given:        -1,
    donate_received:       +20,
    post_deleted_by_report: -10,
    comment_deleted_by_report: -5,
    post_upvote_removed:   -10,
    post_downvote_removed: +2,
    downvote_given_removed: +1,
    report_submitted:      -1,
    report_helpful:        +2,
    report_retracted:      +1,
};

const DAILY_CAP_REASONS = new Set([
    'post_upvoted',
    'post_downvoted',
    'downvote_given',
    'post_upvote_removed',
    'post_downvote_removed',
    'downvote_given_removed',
]);

class ReputationService {
    /**
     * Trao/trừ điểm cho user và ghi nhận lịch sử giao dịch.
     * @param {string} userId - Người nhận/bị trừ điểm danh tiếng (tác giả hoặc voter)
     * @param {string} reason — key từ DELTA_MAP
     * @param {string} targetId - ID bài viết hoặc ID quyên góp (tùy sự kiện)
     * @param {string} voterId - ID người thực hiện vote/hủy vote (nếu có)
     */
    async award(userId, reason, targetId = null, voterId = null) {
        if (!userId || !reason) return;
        const delta = DELTA_MAP[reason];
        if (delta === undefined) return;

        const user = await User.findById(userId);
        if (!user) return;

        let effectiveDelta = delta;

        // Tải động upvote/downvote scores từ database
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

        // Xử lý logic rút/retract vote nếu tìm thấy lịch sử giao dịch gốc
        const retractionMap = {
            'post_upvote_removed': 'post_upvoted',
            'post_downvote_removed': 'post_downvoted',
            'downvote_given_removed': 'downvote_given',
        };

        const matchingType = retractionMap[reason];
        let originalLog = null;

        if (matchingType && targetId && voterId) {
            try {
                // Tìm giao dịch gốc gần nhất của voter này trên targetId
                originalLog = await ReputationHistory.findOne({
                    user: userId,
                    type: matchingType,
                    targetId: targetId,
                    voter: voterId
                }).sort({ createdAt: -1 });

                if (originalLog) {
                    // Nếu giao dịch gốc được cộng/trừ bao nhiêu điểm, thì khi rút ta đảo ngược bấy nhiêu điểm!
                    effectiveDelta = -originalLog.reputationEarned;
                }
            } catch (err) {
                console.error('[ReputationService] Error searching original reputation log for retraction:', err);
            }
        }

        // Áp dụng daily cap cho upvote/downvote
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

            // Xử lý cộng điểm upvote (có giới hạn daily cap)
            if (reason === 'post_upvoted') {
                const remaining = dailyCap - earned;
                if (remaining <= 0) {
                    effectiveDelta = 0; // Đã đạt cap, cộng 0 điểm
                } else {
                    effectiveDelta = Math.min(effectiveDelta, remaining);
                }
            }

            // Xử lý rút upvote (nếu upvote gốc diễn ra trong ngày hôm nay, ta hoàn lại giới hạn cap hôm nay)
            let dailyEarnedDiff = 0;
            if (reason === 'post_upvoted') {
                dailyEarnedDiff = effectiveDelta; // cộng thêm vào daily earned
            } else if (reason === 'post_upvote_removed' && originalLog) {
                const originalLogDate = new Date(originalLog.createdAt);
                const isOriginalToday = originalLogDate.getTime() >= todayStart.getTime();
                if (isOriginalToday) {
                    dailyEarnedDiff = effectiveDelta; // trừ đi phần daily earned (effectiveDelta âm)
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
        } else {
            // Không áp dụng daily cap (donate, report)
            if (effectiveDelta !== 0) {
                const newReputation = Math.max(1, (user.reputation || 1) + effectiveDelta);
                await User.findByIdAndUpdate(userId, { $set: { reputation: newReputation } });
            }
        }

        // Tạo log lịch sử biến động uy tín
        // Ta tạo log khi điểm khác 0, HOẶC khi upvote bị cap (effectiveDelta = 0) để voter sau này hủy vote sẽ biết được điểm gốc là 0.
        if (effectiveDelta !== 0 || reason === 'post_upvoted' || (reason === 'post_upvote_removed' && originalLog && originalLog.reputationEarned === 0)) {
            try {
                let title = 'Biến động uy tín';
                if (reason === 'donate_received' && targetId) {
                    const donation = await DonationTransaction.findById(targetId).populate('donor', 'fullName');
                    title = `Ủng hộ từ ${donation?.donorSnapshot?.fullName || donation?.donor?.fullName || 'Người ẩn danh'}`;
                } else if (targetId) {
                    const post = await Post.findById(targetId).select('title');
                    title = post ? post.title : 'Bài viết đã ẩn/xóa';
                }

                // Tinh chỉnh tiêu đề hiển thị trong lịch sử cho trực quan
                if (reason === 'comment_deleted_by_report') {
                    title = `Bình luận bị xóa do vi phạm: ${title}`;
                } else if (reason === 'post_deleted_by_report') {
                    title = `Bài viết bị xóa do vi phạm: ${title}`;
                } else if (reason === 'post_upvoted' && effectiveDelta === 0) {
                    title = `[Đạt giới hạn ngày] ${title}`;
                } else if (reason === 'post_upvote_removed') {
                    title = `Huỷ upvote: ${title}`;
                } else if (reason === 'post_downvote_removed') {
                    title = `Huỷ downvote: ${title}`;
                } else if (reason === 'downvote_given_removed') {
                    title = `Hoàn điểm downvote đã gửi`;
                } else if (reason === 'downvote_given') {
                    title = `Đã gửi downvote cho bài viết`;
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
                    voter: voterId
                });
            } catch (historyErr) {
                console.error('[ReputationService] Error logging reputation history:', historyErr);
            }
        }
    }

    /**
     * Lấy thông tin reputation + rank của user
     */
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
