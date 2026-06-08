import User from '../model/user.model.js';

// ====================================================================
// REPUTATION SERVICE
// Hệ thống điểm danh tiếng IT Forum — chỉ áp dụng cho upvote/downvote bài viết
// ====================================================================

const DAILY_CAP = 200;  // Tối đa 200 điểm/ngày từ upvote/downvote

const VN_TZ_OFFSET_MIN = 7 * 60;

const getTodayStart = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnNow = new Date(utcMs + VN_TZ_OFFSET_MIN * 60000);
    const vnStart = new Date(vnNow);
    vnStart.setHours(0, 0, 0, 0);
    const vnStartUtcMs = vnStart.getTime() - VN_TZ_OFFSET_MIN * 60000;
    return new Date(vnStartUtcMs);
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
    post_upvote_removed:   -10,
    post_downvote_removed: +2,
    downvote_given_removed: +1,
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
     * Trao/trừ điểm cho user.
     * @param {string} userId
     * @param {string} reason — key từ DELTA_MAP
     */
    async award(userId, reason) {
        if (!userId || !reason) return;
        const delta = DELTA_MAP[reason];
        if (delta === undefined) return;

        const user = await User.findById(userId);
        if (!user) return;

        let effectiveDelta = delta;

        // Áp dụng daily cap cho upvote/downvote
        if (DAILY_CAP_REASONS.has(reason)) {
            const todayStart = getTodayStart();
            const sameDay = user.reputationDailyDate &&
                new Date(user.reputationDailyDate).getTime() === todayStart.getTime();
            const earned = sameDay ? (user.reputationDailyEarned || 0) : 0;

            if (delta > 0) {
                const remaining = DAILY_CAP - earned;
                if (remaining <= 0) return; // Đã đạt cap
                effectiveDelta = Math.min(delta, remaining);
            }

            const newEarned = Math.max(0, earned + (effectiveDelta > 0 ? effectiveDelta : 0));
            const newReputation = Math.max(1, (user.reputation || 1) + effectiveDelta);

            await User.findByIdAndUpdate(userId, {
                $set: {
                    reputation: newReputation,
                    reputationDailyEarned: newEarned,
                    reputationDailyDate: sameDay ? user.reputationDailyDate : todayStart,
                },
            });
            return;
        }

        // Không có daily cap (donate, report)
        const newReputation = Math.max(1, (user.reputation || 1) + effectiveDelta);
        await User.findByIdAndUpdate(userId, { $set: { reputation: newReputation } });
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
