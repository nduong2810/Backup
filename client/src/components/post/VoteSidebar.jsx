// ====================================================================
// VoteSidebar — Nút Upvote / Downvote (cập nhật qua Axios, không reload)
// Layout dọc: ▲ [số] ▼ — theo style DevStack
// ====================================================================

export default function VoteSidebar({
  upvoteCount,
  downvoteCount,
  userVote,
  onVote,
  loading,
}) {
  const totalScore = upvoteCount - downvoteCount;

  return (
    <div className="flex flex-col items-center gap-1 w-12 shrink-0 sticky top-24">
      {/* Nút Upvote */}
      <button
        onClick={() => onVote('upvote')}
        disabled={loading}
        title="Upvote"
        className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center
          ${userVote === 'upvote'
            ? 'border-sky-500 bg-sky-50 text-sky-600 shadow-sm'
            : 'border-slate-200 text-slate-400 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-500'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>

      {/* Tổng điểm */}
      <span
        className={`text-lg font-bold tabular-nums
          ${totalScore > 0 ? 'text-sky-600' : totalScore < 0 ? 'text-red-500' : 'text-slate-700'}
        `}
        title={`${upvoteCount} upvote, ${downvoteCount} downvote`}
      >
        {totalScore}
      </span>

      {/* Nút Downvote */}
      <button
        onClick={() => onVote('downvote')}
        disabled={loading}
        title="Downvote"
        className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center
          ${userVote === 'downvote'
            ? 'border-red-500 bg-red-50 text-red-500 shadow-sm'
            : 'border-slate-200 text-slate-400 hover:border-red-400 hover:bg-red-50 hover:text-red-500'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>
    </div>
  );
}
