import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SaveIconButton from '../ui/SaveIconButton';
import ReputationBadge from '../ui/ReputationBadge';
import { softDeletePost, updatePostVisibilityApi } from '../../services/postService';
import { useToast } from '../../context/ToastContext';
import EditPostModal from './EditPostModal';
import EditHistoryModal from '../common/EditHistoryModal';
import SafeMarkdown from '../common/SafeMarkdown';

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

const statusActorLabel = {
  owner: 'Chủ bài',
  admin: 'Admin',
  system: 'Hệ thống',
};

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
  currentUserRole = '',
  onPostUpdated,
  isAuthenticated = false,
  userReputation = 1,
  onReportPost,
  onShowFlagSummary,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [visibilityTargetStatus, setVisibilityTargetStatus] = useState('');
  const [visibilityReason, setVisibilityReason] = useState('');
  const [visibilityLoading, setVisibilityLoading] = useState(false);
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
  const isAdmin = currentUserRole === 'admin';
  const canManageVisibility = isOwner || isAdmin;
  const isClosed = post.status === 'resolved';
  const canEditPost = isOwner && post.status === 'unresolved';
  const canChangeVisibility = canManageVisibility && ['unresolved', 'resolved'].includes(post.status);
  const nextVisibilityStatus = isClosed ? 'unresolved' : 'resolved';
  const nextVisibilityLabel = isClosed ? 'Mở lại bài viết' : 'Đóng bài viết';
  const isLocked = isClosed || post.status === 'hidden' || post.status === 'deleted';
  const isReopeningVisibility = visibilityTargetStatus === 'unresolved';
  const shouldShowStatusReason = Boolean(post.statusReason) && post.status !== 'unresolved';
  const shouldShowStatusBanner = isClosed || shouldShowStatusReason;

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowConfirm(true);
  };

  const handleOpenVisibilityModal = () => {
    setShowMenu(false);
    setVisibilityTargetStatus(nextVisibilityStatus);
    setVisibilityReason('');
    setVisibilityModalOpen(true);
  };

  const handleConfirmVisibility = async () => {
    const reason = visibilityReason.trim();
    const isReopening = visibilityTargetStatus === 'unresolved';

    if (!isReopening && !reason) {
      toast.warning('Vui lòng nhập lý do đóng bài viết.');
      return;
    }

    if (reason.length > 500) {
      toast.warning('Lý do tối đa 500 ký tự.');
      return;
    }

    setVisibilityLoading(true);
    try {
      const response = await updatePostVisibilityApi(post._id, {
        status: visibilityTargetStatus,
        reason: isReopening ? '' : reason,
      });
      toast.success(response?.data?.message || 'Đã cập nhật trạng thái bài viết.');
      setVisibilityModalOpen(false);
      setVisibilityReason('');
      if (onPostUpdated) await onPostUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái bài viết.');
    } finally {
      setVisibilityLoading(false);
    }
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
      <div className="flex items-start justify-between gap-3 w-full min-w-0">
        <h1 className="-mt-1 font-headline-xl text-headline-xl text-on-surface leading-tight break-words flex-1 min-w-0 w-full max-w-full">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 mt-1 shrink-0">
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
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-150 bg-white py-1.5 shadow-lg z-30 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleSave();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base text-slate-550">
                    {isSaved ? 'bookmark_added' : 'bookmark'}
                  </span>
                  {isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                </button>

                {canManageVisibility && canChangeVisibility && (
                  <button
                    type="button"
                    onClick={handleOpenVisibilityModal}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50/60 border-t border-slate-100 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">{isClosed ? 'lock_open' : 'lock'}</span>
                    {nextVisibilityLabel}
                  </button>
                )}

                {isOwner ? (
                  <>
                    {canEditPost && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setIsEditModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-slate-100 first:border-t-0 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-base text-slate-500">edit</span>
                        Sửa bài viết
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onShowFlagSummary?.();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-slate-100 first:border-t-0 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-base text-slate-550">flag</span>
                      Tình trạng cờ báo cáo
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 border-t border-slate-100 first:border-t-0 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Xóa bài viết
                    </button>
                  </>
                ) : (
                  isAuthenticated && !isAdmin && userReputation >= 15 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onReportPost();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 border-t border-slate-100 first:border-t-0 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-base text-rose-500 font-semibold">report</span>
                      Báo cáo bài viết
                    </button>
                  )
                )}
              </div>
            )}
          </div>
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
              className="w-6 h-6 rounded-full border border-outline-variant object-cover"
            />
            <span className="font-medium text-primary-container hover:underline">{post.author?.fullName}</span>
          </Link>
          {post.author?.role === 'admin' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900 select-none">
              <span className="material-symbols-outlined text-[10px] leading-none">shield</span>
              Quản trị viên
            </span>
          )}
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
                disabled={reactionLoading || isLocked}
                onClick={() => onPostReaction?.('like')}
                icon="thumb_up"
                label="Thích"
                count={likeCount}
                activeClass="border-blue-300 bg-blue-50 text-blue-700"
                hoverClass="hover:bg-blue-50 hover:text-blue-700"
              />
              <SmallReactionButton
                active={userReaction === 'dislike'}
                disabled={reactionLoading || isLocked}
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

      {shouldShowStatusBanner && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isClosed ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]">{isClosed ? 'lock' : 'info'}</span>
            <div className="min-w-0">
              <p className="font-bold">{isClosed ? 'Bài viết đang được đóng' : 'Lịch sử trạng thái bài viết'}</p>
              {shouldShowStatusReason && <p className="mt-1 leading-6">Lý do: {post.statusReason}</p>}
              {post.statusChangedAt && (
                <p className="mt-1 text-xs opacity-75">
                  {statusActorLabel[post.statusChangedByRole] || 'Người dùng'} cập nhật lúc {new Date(post.statusChangedAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <SafeMarkdown content={post.content} className="text-on-surface font-body-md text-body-md" />

      {visibilityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setVisibilityModalOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default"
            aria-label="Đóng"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined">{visibilityTargetStatus === 'resolved' ? 'lock' : 'lock_open'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">{visibilityTargetStatus === 'resolved' ? 'Đóng bài viết' : 'Mở lại bài viết'}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {isReopeningVisibility
                    ? 'Bài viết sẽ được mở lại để người dùng tiếp tục thảo luận. Hệ thống sẽ không lưu hoặc hiển thị lý do mở lại.'
                    : 'Lý do đóng bài sẽ được lưu lại và hiển thị trên bài viết để người xem hiểu vì sao bài bị đóng.'}
                </p>
              </div>
            </div>

            {!isReopeningVisibility && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Lý do</span>
                <textarea
                  value={visibilityReason}
                  onChange={(event) => setVisibilityReason(event.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Ví dụ: Câu hỏi đã được giải quyết, tạm đóng để tránh bình luận thêm..."
                />
                <p className="mt-1 text-right text-xs text-slate-400">{visibilityReason.length}/500</p>
              </label>
            )}
            
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setVisibilityModalOpen(false)}
                disabled={visibilityLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmVisibility}
                disabled={visibilityLoading}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
              >
                {visibilityLoading ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

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