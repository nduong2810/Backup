import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReputationBadge from '../ui/ReputationBadge';

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

const normalizeIds = (items = []) => items.map((item) => String(item?._id || item));

export default function CommentItem({
  comment,
  postAuthorId,
  postType = 'question',
  depth = 0,
  onDonate,
  currentUserId = '',
  isAuthenticated = false,
  onLoginRequired,
  onReactComment,
  reactingCommentId = '',
  replyingToId = '',
  replyContent = '',
  onStartReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  submittingReply = false,
  onDeleteComment,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isAuthor = comment.author?._id === postAuthorId;
  const isCommentOwner = currentUserId && comment.author?._id && String(currentUserId) === String(comment.author._id);
  const maxDepth = 3;
  const likedUserIds = normalizeIds(comment.likes);
  const dislikedUserIds = normalizeIds(comment.dislikes);
  const hasLiked = currentUserId && likedUserIds.includes(String(currentUserId));
  const hasDisliked = currentUserId && dislikedUserIds.includes(String(currentUserId));
  const likeCount = comment.likeCount ?? likedUserIds.length ?? 0;
  const dislikeCount = comment.dislikeCount ?? dislikedUserIds.length ?? 0;
  const isReacting = reactingCommentId === comment._id;
  const isReplying = String(replyingToId) === String(comment._id);

  const handleReact = (reactionType) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    onReactComment?.(comment._id, reactionType);
  };

  const handleStartReply = () => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    onStartReply?.(comment);
  };

  const handleSubmitReply = (event) => {
    event.preventDefault();
    onSubmitReply?.(comment);
  };

  return (
    <div
      className={`flex gap-3 pb-4 ${depth > 0 ? 'border-l-2 border-outline-variant pl-4' : 'border-b border-outline-variant'}`}
      style={{ marginLeft: depth > 0 && depth <= maxDepth ? '0' : '0' }}
    >
      <img
        src={comment.author?.avatar && comment.author.avatar !== 'default-avatar.png'
          ? comment.author.avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.fullName || 'U')}&background=556067&color=fff&size=32`
        }
        alt={comment.author?.fullName}
        className="w-8 h-8 rounded-full border border-outline-variant shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 mb-1 font-body-sm text-body-sm flex-wrap">
            {isAuthor && (
              <span className="font-label-mono text-label-mono font-semibold uppercase px-1.5 py-0.5 rounded border border-primary text-primary bg-primary-fixed">
                Tác giả
              </span>
            )}
            <Link to={comment.author?._id ? `/users/${comment.author._id}` : '#'} className="font-semibold text-primary-container hover:underline">
              {comment.author?.fullName}
            </Link>
            {comment.author?.reputation !== undefined && (
              <ReputationBadge reputation={comment.author.reputation} size="sm" />
            )}
            <span className="text-outline text-xs">· {timeAgo(comment.createdAt)}</span>
          </div>

          {isCommentOwner && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center h-7 w-7 rounded-full hover:bg-surface-container-low transition-colors"
                title="Tùy chọn"
              >
                <span className="material-symbols-outlined text-lg text-slate-500">more_vert</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-0.5 w-32 rounded-xl border border-slate-150 bg-white py-1.5 shadow-lg z-30 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowConfirm(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Xóa bình luận
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-on-surface font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {comment.images && comment.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {comment.images.map((imgUrl, idx) => (
              <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[200px] max-h-[140px] overflow-hidden rounded-lg border border-outline-variant hover:opacity-90 transition-opacity">
                <img src={imgUrl} alt={`Đính kèm ${idx + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {comment.videos && comment.videos.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {comment.videos.map((vidUrl, index) => (
              <div key={index} className="rounded-lg overflow-hidden border border-outline-variant bg-black max-w-[320px] max-h-[200px] flex items-center justify-center">
                <video src={vidUrl} controls className="max-w-full max-h-[200px] object-contain" />
              </div>
            ))}
          </div>
        ) : (
          comment.video && (
            <div className="mt-3 rounded-lg overflow-hidden border border-outline-variant bg-black max-w-[320px] max-h-[200px] flex items-center justify-center">
              <video src={comment.video} controls className="max-w-full max-h-[200px] object-contain" />
            </div>
          )
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {postType === 'question' ? (
            <>
              <button
                type="button"
                onClick={() => handleReact('like')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  hasLiked
                    ? 'border-primary/30 bg-primary-fixed text-primary'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-primary-fixed/30 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                Upvote {likeCount}
              </button>

              <button
                type="button"
                onClick={() => handleReact('dislike')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  hasDisliked
                    ? 'border-error/30 bg-error-container text-error'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-error-container/30 hover:text-error'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                Downvote {dislikeCount}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleReact('like')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  hasLiked
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                Thích {likeCount}
              </button>

              <button
                type="button"
                onClick={() => handleReact('dislike')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  hasDisliked
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                Không thích {dislikeCount}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleStartReply}
            className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-primary-fixed/30 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">reply</span>
            Bình luận
          </button>

          {depth === 0 && typeof onDonate === 'function' && comment.author?._id && (
            <button
              type="button"
              onClick={() => onDonate(comment)}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.5 2.5a1 1 0 00-1 0l-6 3.5a1 1 0 00-.5.866V13.5a1 1 0 00.5.866l6 3.5a1 1 0 001 0l6-3.5a1 1 0 00.5-.866V6.866a1 1 0 00-.5-.866l-6-3.5zM9 6.5h2v2H9v-2zm0 4h2v5H9v-5z" />
              </svg>
              Ủng hộ tác giả
            </button>
          )}
        </div>

        {isReplying && (
          <form onSubmit={handleSubmitReply} className="mt-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-secondary">
                Trả lời {comment.author?.fullName || 'bình luận'}
              </p>
              <button
                type="button"
                onClick={onCancelReply}
                className="text-xs font-semibold text-outline hover:text-error"
              >
                Hủy
              </button>
            </div>
            <textarea
              value={replyContent}
              onChange={(event) => onReplyContentChange?.(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Nhập nội dung trả lời..."
              disabled={submittingReply}
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-xs text-secondary">{replyContent.length}/2000</span>
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postAuthorId={postAuthorId}
                postType={postType}
                depth={depth + 1}
                onDonate={onDonate}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                onLoginRequired={onLoginRequired}
                onReactComment={onReactComment}
                reactingCommentId={reactingCommentId}
                replyingToId={replyingToId}
                replyContent={replyContent}
                onStartReply={onStartReply}
                onCancelReply={onCancelReply}
                onReplyContentChange={onReplyContentChange}
                onSubmitReply={onSubmitReply}
                submittingReply={submittingReply}
                onDeleteComment={onDeleteComment}
              />
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default"
            aria-label="Đóng"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">Xóa bình luận?</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Bình luận này và tất cả câu trả lời bên dưới sẽ bị xóa vĩnh viễn khỏi diễn đàn. Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  const ok = await onDeleteComment?.(comment._id);
                  if (ok) setShowConfirm(false);
                  setDeleting(false);
                }}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
