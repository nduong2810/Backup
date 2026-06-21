export default function StatsReactions({ reactionsGiven }) {
  const liked = reactionsGiven?.liked || 0;
  const disliked = reactionsGiven?.disliked || 0;
  const total = reactionsGiven?.total || 0;

  // Calculate percentages for the progress bar
  const likePct = total > 0 ? Math.round((liked / total) * 100) : 100;
  const dislikePct = total > 0 ? 100 - likePct : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-slate-500">favorite</span>
          Số cảm xúc đã bày tỏ
        </h3>
      </div>

      <div className="space-y-4">
        {/* Total cast */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số lượt bày tỏ:</span>
          <span className="text-sm font-bold text-slate-800">{total}</span>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Likes */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-3 text-center transition-all hover:bg-blue-50/50">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-1">
              <span className="material-symbols-outlined text-lg">thumb_up</span>
            </div>
            <div className="text-lg font-bold text-blue-700">{liked}</div>
            <div className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Thích đã cho</div>
          </div>

          {/* Dislikes */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-3 text-center transition-all hover:bg-rose-50/50">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 mb-1">
              <span className="material-symbols-outlined text-lg">thumb_down</span>
            </div>
            <div className="text-lg font-bold text-rose-700">{disliked}</div>
            <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Không thích đã cho</div>
          </div>
        </div>

        {/* Ratio bar */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>Thích ({likePct}%)</span>
              <span>Không thích ({dislikePct}%)</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${likePct}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${dislikePct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
