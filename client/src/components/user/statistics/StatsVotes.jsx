export default function StatsVotes({ votesGiven }) {
  const upvoted = votesGiven?.upvoted || 0;
  const downvoted = votesGiven?.downvoted || 0;
  const total = votesGiven?.total || 0;

  // Calculate percentages for the progress bar
  const upPct = total > 0 ? Math.round((upvoted / total) * 100) : 100;
  const downPct = total > 0 ? 100 - upPct : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-slate-500">how_to_vote</span>
          Số phiếu bầu đã cho
        </h3>
      </div>

      <div className="space-y-4">
        {/* Total cast */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số lượt bầu chọn:</span>
          <span className="text-sm font-bold text-slate-800">{total}</span>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Upvotes */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 text-center transition-all hover:bg-emerald-50/50">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-1">
              <span className="material-symbols-outlined text-lg">thumb_up</span>
            </div>
            <div className="text-lg font-bold text-emerald-700">{upvoted}</div>
            <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Upvote đã cho</div>
          </div>

          {/* Downvotes */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-3 text-center transition-all hover:bg-rose-50/50">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 mb-1">
              <span className="material-symbols-outlined text-lg">thumb_down</span>
            </div>
            <div className="text-lg font-bold text-rose-700">{downvoted}</div>
            <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Downvote đã cho</div>
          </div>
        </div>

        {/* Ratio bar */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>Upvotes ({upPct}%)</span>
              <span>Downvotes ({downPct}%)</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${upPct}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${downPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
