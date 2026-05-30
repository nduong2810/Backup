import { Link } from 'react-router-dom';

// ====================================================================
// CommentItem — Hiển thị 1 comment + nested replies (recursive)
// Đã tích hợp design tokens từ hệ thống thiết kế chính
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

export default function CommentItem({ comment, postAuthorId, depth = 0, onDonate }) {
  const isAuthor = comment.author?._id === postAuthorId;
  const maxDepth = 3; // Giới hạn indent tối đa

  return (
    <div
      className={`flex gap-3 pb-4 ${depth > 0 ? 'border-l-2 border-outline-variant pl-4' : 'border-b border-outline-variant'}`}
      style={{ marginLeft: depth > 0 && depth <= maxDepth ? '0' : '0' }}
    >
      {/* Avatar */}
      <img
        src={comment.author?.avatar && comment.author.avatar !== 'default-avatar.png'
          ? comment.author.avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.fullName || 'U')}&background=556067&color=fff&size=32`
        }
        alt={comment.author?.fullName}
        className="w-8 h-8 rounded-full border border-outline-variant shrink-0"
      />

      <div className="flex-1 min-w-0">
        {/* Header: Tên + Badge + Thời gian */}
        <div className="flex items-center gap-2 mb-1 font-body-sm text-body-sm">
          {isAuthor && (
            <span className="font-label-mono text-label-mono font-semibold uppercase px-1.5 py-0.5 rounded border border-primary text-primary bg-primary-fixed">
              Tác giả
            </span>
          )}
          <Link to={comment.author?._id ? `/users/${comment.author._id}` : '#'} className="font-semibold text-primary-container hover:underline">
            {comment.author?.fullName}
          </Link>
          <span className="text-outline text-xs">· {timeAgo(comment.createdAt)}</span>
        </div>

        {/* Nội dung comment */}
        <p className="text-on-surface font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {depth === 0 && typeof onDonate === 'function' && comment.author?._id && (
          <button
            type="button"
            onClick={() => onDonate(comment)}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.5 2.5a1 1 0 00-1 0l-6 3.5a1 1 0 00-.5.866V13.5a1 1 0 00.5.866l6 3.5a1 1 0 001 0l6-3.5a1 1 0 00.5-.866V6.866a1 1 0 00-.5-.866l-6-3.5zM9 6.5h2v2H9v-2zm0 4h2v5H9v-5z" />
            </svg>
            Ủng hộ tác giả
          </button>
        )}

        {/* Nested Replies (recursive) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postAuthorId={postAuthorId}
                depth={depth + 1}
                onDonate={onDonate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
