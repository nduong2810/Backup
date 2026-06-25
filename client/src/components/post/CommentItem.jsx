import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReputationBadge from '../ui/ReputationBadge';
import { updateCommentApi } from '../../services/postService';
import { useToast } from '../../context/ToastContext';
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
  postStatus = 'unresolved',
  onCommentUpdated,
  onReportComment,
  bestAnswerId = null,
  onAcceptComment,
  userReputation = undefined,
}) {
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [mediaError, setMediaError] = useState('');
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

  const getNewFilesSize = (newImages, newVideos) => {
    const imagesSize = newImages.filter(x => x.type === 'new').reduce((acc, x) => acc + (x.file?.size || 0), 0);
    const videosSize = newVideos.filter(x => x.type === 'new').reduce((acc, x) => acc + (x.file?.size || 0), 0);
    return imagesSize + videosSize;
  };

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentNewFilesSize = getNewFilesSize(images, videos);
    const incomingFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentNewFilesSize + incomingFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng các hình ảnh và video tải lên mới vượt quá giới hạn 50MB.');
      return;
    }

    files.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setMediaError('Định dạng hình ảnh không hợp lệ (chỉ chấp nhận JPEG, PNG, GIF, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            id: `new-img-${Date.now()}-${Math.random()}`,
            src: reader.result,
            type: 'new',
            file: file
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleVideoChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentNewFilesSize = getNewFilesSize(images, videos);
    const incomingFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentNewFilesSize + incomingFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng các hình ảnh và video tải lên mới vượt quá giới hạn 50MB.');
      return;
    }

    files.forEach((file) => {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-matroska'];
      const allowedVideoExts = ['.mp4', '.webm', '.ogg', '.mkv'];
      const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isValidVideo = allowedVideoTypes.includes(file.type) || allowedVideoExts.includes(fileExt);
      if (!isValidVideo) {
        setMediaError('Định dạng video không hợp lệ (chỉ nhận MP4, WEBM, OGG, MKV).');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos((prev) => [
          ...prev,
          {
            id: `new-vid-${Date.now()}-${Math.random()}`,
            src: reader.result,
            type: 'new',
            file: file
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleRemoveVideo = (id) => {
    setVideos((prev) => prev.filter((vid) => vid.id !== id));
  };

  const isDeleted = comment.content === '[Bình luận bị xóa vì không phù hợp]';
  const isAuthor = comment.author?._id === postAuthorId;
  const isCommentOwner = currentUserId && comment.author?._id && String(currentUserId) === String(comment.author._id);
  const maxDepth = 3;
  const likedUserIds = normalizeIds(comment.likes);
  const dislikedUserIds = normalizeIds(comment.dislikes);
  const hasLiked = currentUserId && likedUserIds.includes(String(currentUserId));
  const hasDisliked = currentUserId && dislikedUserIds.includes(String(currentUserId));
  const likeCount = comment.likeCount ?? likedUserIds.length ?? 0;
  const dislikeCount = comment.dislikeCount ?? dislikedUserIds.length ?? 0;

  const isBestAnswer = bestAnswerId && String(comment._id) === String(bestAnswerId);
  const isPostAuthor = currentUserId && postAuthorId && String(currentUserId) === String(postAuthorId);
  const isPostLocked = postStatus === 'resolved' || postStatus === 'hidden' || postStatus === 'deleted';
  const showAcceptOption = isPostAuthor && postType === 'question' && depth === 0 && !isPostLocked;
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

  const handleUpdateComment = async (event) => {
    event.preventDefault();
    if (!editContent.trim()) {
      toast.error('Nội dung bình luận không được để trống.');
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('content', editContent.trim());

      // Append images
      images.forEach((img) => {
        if (img.type === 'old') {
          formData.append('images', img.src);
        } else if (img.type === 'new' && img.file) {
          formData.append('images', img.file);
        }
      });

      // Append videos
      videos.forEach((vid) => {
        if (vid.type === 'old') {
          formData.append('videos', vid.src);
        } else if (vid.type === 'new' && vid.file) {
          formData.append('videos', vid.file);
        }
      });

      await updateCommentApi(comment._id, formData);
      toast.success('Cập nhật bình luận thành công!');
      setIsEditing(false);
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (err) {
      let errMsg = 'Có lỗi xảy ra khi cập nhật bình luận.';
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errMsg = err.response.data.errors[0].msg;
      }
      toast.error(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`flex gap-3 pb-4 w-full min-w-0 ${
        isBestAnswer
          ? 'bg-emerald-50/40 border-2 border-emerald-500/20 rounded-xl p-4 shadow-sm'
          : depth > 0
            ? 'border-l-2 border-outline-variant pl-4'
            : 'border-b border-outline-variant'
      }`}
      style={{ marginLeft: depth > 0 && depth <= maxDepth ? '0' : '0' }}
    >
      <img
        src={comment.author?.avatar && comment.author.avatar !== 'default-avatar.png'
          ? comment.author.avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.fullName || 'U')}&background=556067&color=fff&size=32`
        }
        alt={comment.author?.fullName}
        className="w-8 h-8 rounded-full border border-outline-variant shrink-0 object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 mb-1 font-body-sm text-body-sm flex-wrap">
            {isBestAnswer && (
              <span className="font-label-mono text-xs font-semibold uppercase px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-700 bg-emerald-50 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] font-bold text-emerald-600">check</span>
                Tốt nhất
              </span>
            )}
            {isAuthor && (
              <span className="font-label-mono text-label-mono font-semibold uppercase px-1.5 py-0.5 rounded border border-primary text-primary bg-primary-fixed">
                Tác giả
              </span>
            )}
            <Link to={comment.author?._id ? `/users/${comment.author._id}` : '#'} className="font-semibold text-primary-container hover:underline">
              {comment.author?.fullName}
            </Link>
            {comment.author?.role === 'admin' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900 select-none">
                <span className="material-symbols-outlined text-[10px] leading-none">shield</span>
                Quản trị viên
              </span>
            )}
            {comment.author?.reputation !== undefined && (
              <ReputationBadge reputation={comment.author.reputation} size="sm" />
            )}
            <span className="text-outline text-xs flex items-center gap-1">
              · {timeAgo(comment.createdAt)}
              {comment.editHistory && comment.editHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-primary hover:underline font-semibold text-[10px] flex items-center gap-0.5 ml-1 transition"
                >
                  <span className="material-symbols-outlined text-[12px]">history</span>
                  (Đã chỉnh sửa)
                </button>
              )}
            </span>
          </div>

          {isAuthenticated && !isDeleted && (
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
                <div className="absolute right-0 mt-0.5 w-44 rounded-xl border border-slate-150 bg-white py-1.5 shadow-lg z-30 animate-fadeIn">
                  {showAcceptOption && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onAcceptComment?.(comment._id);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold border-b border-slate-100 whitespace-nowrap ${
                        isBestAnswer 
                          ? 'text-amber-750 hover:bg-amber-50' 
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isBestAnswer ? 'close' : 'check_circle'}
                      </span>
                      {isBestAnswer ? 'Hủy chọn tốt nhất' : 'Chọn tốt nhất'}
                    </button>
                  )}
                  {isCommentOwner ? (
                    <>
                      {postStatus === 'unresolved' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setEditContent(comment.content || '');
                            setImages((comment.images || []).map((url, idx) => ({ id: `old-img-${idx}`, src: url, type: 'old' })));
                            setVideos((comment.videos || []).map((url, idx) => ({ id: `old-vid-${idx}`, src: url, type: 'old' })));
                            setMediaError('');
                            setIsEditing(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-base text-slate-500">edit</span>
                          Sửa bình luận
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setShowMenu(false); setShowConfirm(true); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Xóa bình luận
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onReportComment?.(comment);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-base text-rose-500 font-semibold">report</span>
                      Báo cáo bình luận
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateComment} className="mt-2 rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Nhập nội dung bình luận cần chỉnh sửa..."
              disabled={updating}
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 font-body-sm"
              required
            />

            {/* Media previews list with delete buttons */}
            {(images.length > 0 || videos.length > 0) && (
              <div className="space-y-2 pt-1">
                {/* Images list */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-outline-variant group">
                        <img src={img.src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-0.5"
                        >
                          <span className="material-symbols-outlined text-[12px] block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Videos list */}
                {videos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {videos.map((vid) => (
                      <div key={vid.id} className="relative w-32 rounded-lg overflow-hidden border border-outline-variant bg-black flex items-center justify-center group">
                        <video src={vid.src} className="w-full h-20 object-contain" controls={false} muted />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(vid.id)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-0.5 z-10"
                        >
                          <span className="material-symbols-outlined text-[12px] block">close</span>
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <span className="material-symbols-outlined text-white text-2xl">play_circle</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mediaError && (
              <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg px-2.5 py-1">
                {mediaError}
              </p>
            )}

            {/* Media attachment triggers */}
            <div className="flex items-center gap-2 pt-1">
              <label className="flex h-7 items-center gap-1 rounded-full border border-outline-variant px-3 text-[11px] font-semibold text-secondary hover:bg-surface-container-high transition cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">image</span>
                <span>Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={updating}
                />
              </label>

              <label className="flex h-7 items-center gap-1 rounded-full border border-outline-variant px-3 text-[11px] font-semibold text-secondary hover:bg-surface-container-high transition cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">videocam</span>
                <span>Thêm video</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={updating}
                />
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/60 pt-2">
              <span className="text-[11px] text-secondary">{editContent.length}/2000 ký tự</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={updating}
                  className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-surface-container-high transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating || !editContent.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1"
                >
                  {updating && <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </div>
          </form>
        ) : isDeleted ? (
          <p className="text-outline font-body-sm text-body-sm leading-relaxed italic break-words w-full max-w-full">
            {comment.content}
          </p>
        ) : (
          <SafeMarkdown content={comment.content} className="text-on-surface font-body-sm text-body-sm" />
        )}

        {!isEditing && comment.images && comment.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {comment.images.map((imgUrl, idx) => (
              <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[200px] max-h-[140px] overflow-hidden rounded-lg border border-outline-variant hover:opacity-90 transition-opacity cursor-zoom-in">
                <img src={imgUrl} alt={`Đính kèm ${idx + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {!isEditing && (
          comment.videos && comment.videos.length > 0 ? (
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
          )
        )}

        {!isDeleted && (
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
                  disabled={isReacting || (isAuthenticated && userReputation !== undefined && userReputation < 100)}
                  title={isAuthenticated && userReputation !== undefined && userReputation < 100 ? "Bạn cần tối thiểu 100 điểm uy tín để Downvote" : "Bình chọn xuống"}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    hasDisliked
                      ? 'border-error/30 bg-error-container text-error'
                      : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-error-container/30 hover:text-error'
                  } ${(isAuthenticated && userReputation !== undefined && userReputation < 100) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {!isPostLocked && (
              <button
                type="button"
                onClick={handleStartReply}
                className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-primary-fixed/30 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">reply</span>
                {postType === 'advice' ? 'Bình luận' : 'Trả lời'}
              </button>
            )}

            {!isPostLocked && depth === 0 && typeof onDonate === 'function' && comment.author?._id && comment.author?.role !== 'admin' && (
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
        )}

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
                postStatus={postStatus}
                onCommentUpdated={onCommentUpdated}
                onReportComment={onReportComment}
                bestAnswerId={bestAnswerId}
                onAcceptComment={onAcceptComment}
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

      <EditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={comment.editHistory || []}
        type="comment"
        title="Lịch sử chỉnh sửa bình luận"
      />
    </div>
  );
}
