import { Link } from 'react-router-dom';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StatsReputation({ reputationChanges = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-slate-500">military_tech</span>
          Lịch sử uy tín gần đây
        </h3>
      </div>

      {/* List */}
      {!reputationChanges.length ? (
        <div className="flex h-36 flex-col items-center justify-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">military_tech</span>
          Chưa có biến động uy tín nào
        </div>
      ) : (
        <div className="space-y-3">
          {reputationChanges.map((change) => {
            const rep = change.reputationEarned ?? 0;
            const isPositive = rep > 0;
            const isNeutral = rep === 0;
            const isPostEvent = change.type?.startsWith('post_');
            
            let displayMsg = '';
            if (change.type === 'post_upvoted') {
              displayMsg = 'Nhận upvote cho bài viết:';
            } else if (change.type === 'post_upvote_removed') {
              displayMsg = 'Huỷ upvote cho bài viết:';
            } else if (change.type === 'post_downvoted') {
              displayMsg = 'Nhận downvote cho bài viết:';
            } else if (change.type === 'post_downvote_removed') {
              displayMsg = 'Huỷ downvote cho bài viết:';
            } else if (change.type === 'downvote_given') {
              displayMsg = 'Bị trừ điểm gửi downvote:';
            } else if (change.type === 'downvote_given_removed') {
              displayMsg = 'Hoàn điểm gửi downvote:';
            } else if (change.type === 'donate_received') {
              displayMsg = 'Giao dịch:';
            } else {
              displayMsg = 'Biến động uy tín:';
            }

            // Extract original post ID from compound ID (e.g. postId_upvote)
            const postId = change._id.split('_')[0];

            return (
              <div
                key={change._id}
                className="flex items-center gap-3 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 transition-colors hover:bg-slate-50/50"
              >
                {/* Score */}
                <div
                  className={`flex shrink-0 items-center justify-center rounded border px-2 py-0.5 text-xs font-bold ${
                    isPositive
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : isNeutral
                      ? 'bg-slate-100 border-slate-200 text-slate-500'
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}
                >
                  {isPositive ? `+${rep}` : rep}
                </div>

                {/* Event description */}
                <div className="min-w-0 flex-1 text-xs">
                  <span className="text-slate-500">{displayMsg} </span>
                  {isPostEvent ? (
                    <Link
                      to={`/posts/${postId}`}
                      className="font-semibold text-slate-700 hover:text-blue-600 hover:underline transition-colors block truncate mt-0.5"
                    >
                      {change.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-700 block truncate mt-0.5">
                      {change.title}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="shrink-0 text-right text-[10px] text-slate-400">
                  {formatDate(change.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
