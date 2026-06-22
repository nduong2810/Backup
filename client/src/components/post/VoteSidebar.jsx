// ====================================================================
// VoteSidebar — Nút Upvote / Downvote (cập nhật qua Axios, không reload)
// Layout dọc: ▲ [số] ▼ — theo style DevStack
// Đã tích hợp design tokens từ hệ thống thiết kế chính
// ====================================================================

export default function VoteSidebar({
  upvoteCount,
  downvoteCount,
  userVote,
  onVote,
  loading,
  disabled = false,
  userReputation,
  weeklyFreeVotesUsed = 0,
  weeklyFreeVotesLimit = 5,
}) {
  const totalScore = upvoteCount - downvoteCount;
  const isDisabled = loading || disabled;

  return (
    <div className="flex flex-col items-center gap-1 w-12 shrink-0 sticky top-24">
      {/* Nút Upvote */}
      <button
        onClick={() => !isDisabled && onVote('upvote')}
        disabled={isDisabled}
        title={disabled ? 'Bài viết đã bị khóa, không thể vote' : 'Bình chọn lên'}
        className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center
          ${userVote === 'upvote'
            ? 'border-primary bg-primary-fixed text-primary shadow-sm'
            : 'border-outline-variant text-outline hover:border-primary hover:bg-primary-fixed/30 hover:text-primary'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed hover:border-outline-variant hover:bg-transparent hover:text-outline' : 'cursor-pointer active:scale-95'}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>

      {/* Tổng điểm */}
      <span
        className={`text-lg font-bold tabular-nums
          ${totalScore > 0 ? 'text-primary' : totalScore < 0 ? 'text-error' : 'text-on-surface'}
        `}
        title={`${upvoteCount} lượt đồng ý, ${downvoteCount} lượt phản đối`}
      >
        {totalScore}
      </span>

      {/* Nút Downvote */}
      <button
        onClick={() => {
          const isDownvoteLockedByRep = userReputation !== undefined && userReputation >= 15 && userReputation < 100;
          const isDownvoteDisabled = isDisabled || isDownvoteLockedByRep;
          if (!isDownvoteDisabled) onVote('downvote');
        }}
        disabled={isDisabled || (userReputation !== undefined && userReputation >= 15 && userReputation < 100)}
        title={disabled ? 'Bài viết đã bị khóa, không thể vote' : (userReputation !== undefined && userReputation >= 15 && userReputation < 100) ? 'Bạn cần tối thiểu 100 điểm uy tín để Downvote' : 'Bình chọn xuống'}
        className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center
          ${userVote === 'downvote'
            ? 'border-error bg-error-container text-error shadow-sm'
            : 'border-outline-variant text-outline hover:border-error hover:bg-error-container/30 hover:text-error'
          }
          ${(isDisabled || (userReputation !== undefined && userReputation >= 15 && userReputation < 100)) ? 'opacity-50 cursor-not-allowed hover:border-outline-variant hover:bg-transparent hover:text-outline' : 'cursor-pointer active:scale-95'}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>

      {/* Hiển thị số lượt vote miễn phí tuần còn lại nếu reputation < 15 */}
      {userReputation !== undefined && userReputation < 15 && (
        <div className="flex flex-col items-center mt-3 text-center w-16 px-1 border border-outline-variant/30 bg-surface-container-low/50 py-1.5 rounded-lg select-none">
          <span className="text-[8px] font-bold text-primary uppercase tracking-wide leading-none">Free vote</span>
          <span className="text-xs font-extrabold text-on-surface mt-1 tabular-nums">
            {Math.max(0, weeklyFreeVotesLimit - weeklyFreeVotesUsed)}/5
          </span>
          <span className="text-[7px] text-secondary mt-0.5 leading-none">lượt còn lại</span>
        </div>
      )}
    </div>
  );
}
