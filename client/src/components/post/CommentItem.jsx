// ====================================================================
// CommentItem — Hiển thị 1 comment + nested replies (recursive)
// ====================================================================

// Helper: Format thời gian
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function CommentItem({ comment, postAuthorId, depth = 0 }) {
  const isAuthor = comment.author?._id === postAuthorId;
  const maxDepth = 3; // Giới hạn indent tối đa

  return (
    <div
      className={`flex gap-3 pb-4 ${depth > 0 ? 'border-l-2 border-slate-100 pl-4' : 'border-b border-slate-100'}`}
      style={{ marginLeft: depth > 0 && depth <= maxDepth ? '0' : '0' }}
    >
      {/* Avatar */}
      <img
        src={comment.author?.avatar && comment.author.avatar !== 'default-avatar.png'
          ? comment.author.avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.fullName || 'U')}&background=64748b&color=fff&size=32`
        }
        alt={comment.author?.fullName}
        className="w-8 h-8 rounded-full border border-slate-200 shrink-0"
      />

      <div className="flex-1 min-w-0">
        {/* Header: Tên + Badge + Thời gian */}
        <div className="flex items-center gap-2 mb-1 text-sm">
          {isAuthor && (
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border border-sky-400 text-sky-600 bg-sky-50">
              Tác giả
            </span>
          )}
          <span className="font-semibold text-sky-600">{comment.author?.fullName}</span>
          <span className="text-slate-400 text-xs">· {timeAgo(comment.createdAt)}</span>
        </div>

        {/* Nội dung comment */}
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Nested Replies (recursive) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postAuthorId={postAuthorId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
