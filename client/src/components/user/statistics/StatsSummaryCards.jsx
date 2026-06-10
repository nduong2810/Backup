import { useMemo } from 'react';

// ====================================================================
// STATS SUMMARY CARDS - 6 card tổng quan hoạt động user
// ====================================================================

const cardConfigs = [
  {
    key: 'posts',
    label: 'Bài viết',
    icon: 'edit_note',
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    getValue: (s) => s.totalPosts || 0,
    getSub: (s) => {
      const q = s.postsByType?.question || 0;
      const a = s.postsByType?.advice || 0;
      return `${q} hỏi đáp · ${a} chia sẻ`;
    },
  },
  {
    key: 'comments',
    label: 'Bình luận',
    icon: 'chat_bubble_outline',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    getValue: (s) => s.totalComments || 0,
    getSub: (s) => `${s.totalCommentLikes || 0} likes nhận được`,
  },
  {
    key: 'upvotes',
    label: 'Upvotes nhận',
    icon: 'thumb_up',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    getValue: (s) => s.totalUpvotes || 0,
    getSub: (s) => `${s.totalDownvotes || 0} downvotes`,
  },
  {
    key: 'views',
    label: 'Lượt xem',
    icon: 'visibility',
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-700',
    getValue: (s) => s.totalViews || 0,
    getSub: () => 'Tổng trên tất cả bài',
  },
  {
    key: 'reputation',
    label: 'Điểm Reputation',
    icon: 'military_tech',
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    getValue: (s) => s.reputation || 1,
    getSub: (s) => s.rankInfo?.name || 'Newbie',
  },
  {
    key: 'donations',
    label: 'Giao dịch ủng hộ',
    icon: 'volunteer_activism',
    gradient: 'from-cyan-500 to-sky-600',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    getValue: (s) => {
      const amount = s.donations?.received?.totalAmount || 0;
      return amount > 0 ? `+${amount.toLocaleString('vi-VN')}đ` : '0đ';
    },
    getSub: (s) => {
      const sentAmount = s.donations?.sent?.totalAmount || 0;
      const sentCount = s.donations?.sent?.count || 0;
      return `Đã gửi: ${sentAmount > 0 ? `${sentAmount.toLocaleString('vi-VN')}đ` : '0đ'} (${sentCount} lượt)`;
    },
  },
];

function formatNumber(value) {
  if (typeof value === 'string') return value;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export default function StatsSummaryCards({ summary }) {
  const cards = useMemo(() => {
    if (!summary) return [];
    return cardConfigs.map((cfg) => ({
      ...cfg,
      value: cfg.getValue(summary),
      sub: cfg.getSub(summary),
    }));
  }, [summary]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Gradient accent bar */}
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80 transition-opacity group-hover:opacity-100`} />

          {/* Icon */}
          <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.bgLight} transition-transform duration-300 group-hover:scale-110`}>
            <span className={`material-symbols-outlined text-xl ${card.textColor}`}>{card.icon}</span>
          </div>

          {/* Value */}
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatNumber(card.value)}
          </div>

          {/* Label */}
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {card.label}
          </div>

          {/* Sub info */}
          <div className="mt-2 text-[11px] leading-snug text-slate-400">
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
