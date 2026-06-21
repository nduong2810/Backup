import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SaveIconButton from '../ui/SaveIconButton';
import ReputationBadge from '../ui/ReputationBadge';
import { softDeletePost } from '../../services/postService';
import { useToast } from '../../context/ToastContext';
import EditPostModal from './EditPostModal';
import EditHistoryModal from '../common/EditHistoryModal';

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
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

const SmallReactionButton = ({ active, disabled, onClick, icon, label, count, activeClass, hoverClass }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
      active
        ? activeClass
        : `border-outline-variant bg-surface-container-lowest text-secondary ${hoverClass}`
    }`}
  >
    <span className="material-symbols-outlined text-[15px]">{icon}</span>
    <span>{label}</span>
    <span>{count}</span>
  </button>
);

export default function PostContent({
  post,
  commentCount,
  isSaved,
  onToggleSave,
  likeCount = 0,
  dislikeCount = 0,
  userReaction = null,
  reactionLoading = false,
  onPostReaction,
  currentUserId = '',
  onPostUpdated,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const menuRef = useRef(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!post) return null;

  const isOwner = currentUserId && post.author?._id && String(currentUserId) === String(post.author._id);

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await softDeletePost(post._id);
      toast.success('Đã di chuyển bài viết vào thùng rác!');
      setShowConfirm(false);
      navigate('/home');
    } catch (err) {
      console.error('[PostContent] Delete error:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="flex-1 min-w-0 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="-mt-1 font-headline-xl text-headline-xl text-on-surface leading-tight break-words flex-1">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <SaveIconButton
            saved={isSaved}
            onClick={onToggleSave}
            title={isSaved ? 'Đã lưu' : 'Lưu'}
          />
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-surface-container-low transition-colors"
                title="Tùy chọn"
              >
                <span className="material-symbols-outlined text-xl text-slate-500">more_vert</span>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl border border-slate-150 bg-white py-1.5 shadow-lg z-30 animate-fadeIn">
                  {(post.status === 'active' || post.status === 'unresolved') && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-base text-slate-500">edit</span>
                      Sửa bài viết
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Xóa bài viết
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 font-body-sm text-body-sm text-secondary pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Link to={post.author?._id ? `/users/${post.author._id}` : '#'} className="flex items-center gap-2">
            <img
              src={post.author?.avatar && post.author.avatar !== 'default-avatar.png'
                ? post.author.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullName || 'U')}&background=0066cc&color=fff&size=32`
              }
              alt={post.author?.fullName}
              className="w-6 h-6 rounded-full border border-outline-variant"
            />
            <span className="font-medium text-primary-container hover:underline">{post.author?.fullName}</span>
          </Link>
          {post.author?.reputation !== undefined && (
            <ReputationBadge reputation={post.author.reputation} size="sm" />
          )}
          {post.author?.major && (
            <span className="text-outline">· {post.author.major}</span>
          )}
        </div>

        <span className="text-outline flex items-center gap-1.5 flex-wrap">
          · {timeAgo(post.createdAt)}
          {post.editHistory && post.editHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-primary hover:underline font-semibold text-xs flex items-center gap-0.5 ml-1 transition"
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              (Đã chỉnh sửa)
            </button>
          )}
        </span>

        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <span>{post.viewCount?.toLocaleString()} lượt xem</span>
        </div>

        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span>{commentCount} {post.postType === 'question' ? 'câu trả lời' : 'bình luận'}</span>
        </div>

        <div className="basis-full flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-2">
            {post.tags && post.tags.length > 0 && post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-lg font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] border border-outline-variant hover:bg-secondary-fixed/80 transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>

          {post.postType === 'advice' && (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <SmallReactionButton
                active={userReaction === 'like'}
                disabled={reactionLoading}
                onClick={() => onPostReaction?.('like')}
                icon="thumb_up"
                label="Thích"
                count={likeCount}
                activeClass="border-blue-300 bg-blue-50 text-blue-700"
                hoverClass="hover:bg-blue-50 hover:text-blue-700"
              />
              <SmallReactionButton
                active={userReaction === 'dislike'}
                disabled={reactionLoading}
                onClick={() => onPostReaction?.('dislike')}
                icon="thumb_down"
                label="Không thích"
                count={dislikeCount}
                activeClass="border-rose-300 bg-rose-50 text-rose-700"
                hoverClass="hover:bg-rose-50 hover:text-rose-700"
              />
            </div>
          )}
        </div>
      </div>

      <div className="text-on-surface font-body-md text-body-md leading-relaxed whitespace-pre-wrap">
        {post.content}
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
                <h3 className="text-base font-bold text-slate-800">Xóa bài viết của bạn?</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Bài viết này sẽ được di chuyển vào thùng rác của bạn. Bạn vẫn có thể khôi phục lại bài viết này trong vòng 7 ngày tiếp theo.
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
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onUpdateSuccess={onPostUpdated}
      />

      <EditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={post.editHistory || []}
        type="post"
        title="Lịch sử chỉnh sửa bài viết"
      />
    </article>
  );
}
