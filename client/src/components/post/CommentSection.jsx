import { useState } from 'react';
import CommentItem from './CommentItem';

// ====================================================================
// CommentSection — Section bình luận với form thêm bình luận và danh sách comments
// ====================================================================

export default function CommentSection({
  comments,
  commentCount,
  postAuthorId,
  postType = 'question',
  onDonate,
  isAuthenticated = false,
  onLoginRequired,
  onSubmitComment,
  submittingComment = false,
  commentError = '',
  currentUserId = '',
  onReactComment,
  reactingCommentId = '',
  onDeleteComment,
  postStatus = 'unresolved',
  onCommentUpdated,
  onReportComment,
  bestAnswerId = null,
  onAcceptComment,
}) {
  const [content, setContent] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [mediaError, setMediaError] = useState('');
  const [replyingToId, setReplyingToId] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const isLocked = postStatus === 'resolved' || postStatus === 'hidden' || postStatus === 'deleted';

  const resetMainForm = () => {
    setContent('');
    setImagePreviews([]);
    setVideoPreviews([]);
    setImageFiles([]);
    setVideoFiles([]);
    setMediaError('');
  };

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentVideosSize = videoFiles.reduce((acc, v) => acc + v.size, 0);
    const currentImagesSize = imageFiles.reduce((acc, img) => acc + img.size, 0);
    const newFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentVideosSize + currentImagesSize + newFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng của tất cả hình ảnh và video đính kèm vượt quá giới hạn cho phép 50MB.');
      return;
    }

    files.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setMediaError('Định dạng hình ảnh không hợp lệ (chỉ chấp nhận JPEG, PNG, GIF, WEBP).');
        return;
      }

      setImageFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleVideoChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentVideosSize = videoFiles.reduce((acc, v) => acc + v.size, 0);
    const currentImagesSize = imageFiles.reduce((acc, img) => acc + img.size, 0);
    const newFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentVideosSize + currentImagesSize + newFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng của tất cả hình ảnh và video đính kèm vượt quá giới hạn cho phép 50MB.');
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

      setVideoFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews((prev) => [...prev, { src: reader.result, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== index));
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveVideo = (index) => {
    setVideoPreviews((prev) => prev.filter((_, idx) => idx !== index));
    setVideoFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    const text = content.trim();
    if (!text && imageFiles.length === 0 && videoFiles.length === 0) return;

    const formData = new FormData();
    formData.append('content', text || 'Đính kèm tệp tin.');

    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    videoFiles.forEach((file) => {
      formData.append('videos', file);
    });

    const ok = await onSubmitComment?.(formData);
    if (ok !== false) resetMainForm();
  };

  const handleStartReply = (comment) => {
    setReplyingToId(comment?._id || '');
    setReplyContent('');
  };

  const handleCancelReply = () => {
    setReplyingToId('');
    setReplyContent('');
  };

  const handleSubmitReply = async (comment) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    const text = replyContent.trim();
    const parentCommentId = comment?._id || replyingToId;
    if (!text || !parentCommentId || submittingReply) return;

    setSubmittingReply(true);
    const formData = new FormData();
    formData.append('content', text);
    formData.append('parentComment', parentCommentId);

    const ok = await onSubmitComment?.(formData);
    if (ok !== false) handleCancelReply();
    setSubmittingReply(false);
  };

  const isQuestion = postType === 'question';
  const sectionLabel = isQuestion ? 'Câu trả lời' : 'Bình luận';
  const formLabel = isQuestion ? 'Viết câu trả lời' : 'Viết bình luận';
  const placeholderAuth = isQuestion ? 'Nhập câu trả lời của bạn...' : 'Nhập bình luận của bạn...';
  const placeholderGuest = isQuestion ? 'Đăng nhập để trả lời' : 'Đăng nhập để bình luận';
  const submitLabel = isQuestion ? 'Gửi câu trả lời' : 'Gửi bình luận';
  const loginLabel = isQuestion ? 'Đăng nhập để trả lời' : 'Đăng nhập';
  const emptyLabel = isQuestion ? 'Chưa có câu trả lời nào. Hãy là người đầu tiên!' : 'Chưa có bình luận nào. Hãy là người đầu tiên!';

  return (
    <section className="mt-8">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        {commentCount} {sectionLabel}
      </h3>

      <form onSubmit={handleSubmit} className="mb-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        {isLocked && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 animate-fadeIn">
            <span className="material-symbols-outlined text-amber-600 text-xl font-bold">lock</span>
            <div>
              <span className="font-bold">Bài viết đã khóa:</span> Bài viết này đã bị đóng hoặc ẩn. Không thể thêm bình luận mới.
            </div>
          </div>
        )}
        <label className="mb-2 block text-sm font-semibold text-on-surface">{formLabel}</label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={isLocked ? "Bài viết đã bị khóa, không thể thêm bình luận." : (isAuthenticated ? placeholderAuth : placeholderGuest)}
          disabled={submittingComment || isLocked}
          className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        {imagePreviews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {imagePreviews.map((imgBase64, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant group">
                <img src={imgBase64} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-0.5"
                >
                  <span className="material-symbols-outlined text-[14px] block">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {videoPreviews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {videoPreviews.map((vid, index) => (
              <div key={index} className="relative w-48 rounded-lg overflow-hidden border border-outline-variant bg-black flex items-center justify-center group">
                <video src={vid.src} className="w-full h-32 object-contain" controls={false} muted />
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(index)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-0.5 z-10"
                >
                  <span className="material-symbols-outlined text-[14px] block">close</span>
                </button>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <span className="material-symbols-outlined text-white text-3xl">play_circle</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="flex h-8 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-[12px] font-semibold text-secondary hover:bg-surface-container-low transition cursor-pointer">
              <span className="material-symbols-outlined text-[16px] leading-none">image</span>
              <span>Thêm ảnh</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={submittingComment || isLocked} />
            </label>

            <label className="flex h-8 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-[12px] font-semibold text-secondary hover:bg-surface-container-low transition cursor-pointer">
              <span className="material-symbols-outlined text-[16px] leading-none">videocam</span>
              <span>Thêm video</span>
              <input type="file" accept="video/*" multiple onChange={handleVideoChange} className="hidden" disabled={submittingComment || isLocked} />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-secondary">{content.length}/2000 ký tự</p>
            <button
              type="submit"
              disabled={submittingComment || isLocked || (!content.trim() && imageFiles.length === 0 && videoFiles.length === 0)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingComment ? 'Đang gửi...' : isAuthenticated ? submitLabel : loginLabel}
            </button>
          </div>
        </div>

        {mediaError && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{mediaError}</p>}
        {commentError && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{commentError}</p>}
      </form>

      {comments && comments.length > 0 ? (
        <div className="flex flex-col gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-sm">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postAuthorId={postAuthorId}
              postType={postType}
              onDonate={onDonate}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              onLoginRequired={onLoginRequired}
              onReactComment={onReactComment}
              reactingCommentId={reactingCommentId}
              replyingToId={replyingToId}
              replyContent={replyContent}
              onStartReply={handleStartReply}
              onCancelReply={handleCancelReply}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              submittingReply={submittingReply || submittingComment}
              onDeleteComment={onDeleteComment}
              postStatus={postStatus}
              onCommentUpdated={onCommentUpdated}
              onReportComment={onReportComment}
              bestAnswerId={bestAnswerId}
              onAcceptComment={onAcceptComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-outline bg-surface-container-low rounded-xl border border-outline-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-body-sm font-body-sm">{emptyLabel}</p>
        </div>
      )}
    </section>
  );
}
