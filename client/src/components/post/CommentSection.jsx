import { useState, useRef } from 'react';
import CommentItem from './CommentItem';
import SafeMarkdown from '../common/SafeMarkdown';

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
  userReputation = undefined,
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

  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  const resetMainForm = () => {
    setContent('');
    setImagePreviews([]);
    setVideoPreviews([]);
    setImageFiles([]);
    setVideoFiles([]);
    setMediaError('');
    setEditorMode('write');
  };

  const insertMarkdown = (syntaxBefore, syntaxAfter = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const placeholder = selectedText || defaultText;
    const replacement = syntaxBefore + placeholder + syntaxAfter;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    // Focus and select the text
    setTimeout(() => {
      textarea.focus();
      const selectionStart = start + syntaxBefore.length;
      const selectionEnd = selectionStart + placeholder.length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const insertList = (isNumbered) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    let replacement = '';

    if (selectedText.trim()) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map((line, index) => {
        if (!line.trim()) return line;
        const prefix = isNumbered ? `${index + 1}. ` : '- ';
        if (isNumbered) {
          if (/^\d+\.\s/.test(line)) return line;
          return prefix + line;
        } else {
          if (line.startsWith('- ')) return line;
          return prefix + line;
        }
      });
      replacement = formattedLines.join('\n');
    } else {
      replacement = isNumbered ? '1. mục danh sách' : '- mục danh sách';
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageFiles.length + files.length > 10) {
      setMediaError('Số lượng hình ảnh đính kèm vượt quá giới hạn cho phép (Tối đa: 10 hình ảnh).');
      return;
    }

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

    if (videoFiles.length + files.length > 5) {
      setMediaError('Số lượng video đính kèm vượt quá giới hạn cho phép (Tối đa: 5 video).');
      return;
    }

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

  const handleSubmitReply = async (formDataOrComment) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    let formData;
    if (formDataOrComment instanceof FormData) {
      formData = formDataOrComment;
    } else {
      const text = replyContent.trim();
      const parentCommentId = formDataOrComment?._id || replyingToId;
      if (!text || !parentCommentId || submittingReply) return;

      formData = new FormData();
      formData.append('content', text);
      formData.append('parentComment', parentCommentId);
    }

    setSubmittingReply(true);
    const ok = await onSubmitComment?.(formData);
    if (ok !== false) handleCancelReply();
    setSubmittingReply(false);
    return ok;
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-on-surface">{formLabel}</label>
          {isAuthenticated && !isLocked && (
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setEditorMode('write')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  editorMode === 'write'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Viết
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  editorMode === 'preview'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Xem trước
              </button>
            </div>
          )}
        </div>

        {editorMode === 'write' || !isAuthenticated || isLocked ? (
          <>
            {/* Formatting Toolbar */}
            {isAuthenticated && !isLocked && (
              <div className="flex items-center gap-1 mb-2 p-1 rounded-xl bg-slate-50 border border-slate-200/60 w-fit">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**', 'chữ in đậm')}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="In đậm (Bold)"
                >
                  <span className="material-symbols-outlined text-[18px]">format_bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*', 'chữ in nghiêng')}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="In nghiêng (Italic)"
                >
                  <span className="material-symbols-outlined text-[18px]">format_italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`', 'code inline')}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="Code dòng (Inline Code)"
                >
                  <span className="material-symbols-outlined text-[18px]">code</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('```yaml\n', '\n```', '// viết code tại đây')}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="Khối Code (Code Block)"
                >
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[', '](url)', 'Tên liên kết')}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="Thêm liên kết (Link)"
                >
                  <span className="material-symbols-outlined text-[18px]">link</span>
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => insertList(false)}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="Danh sách không thứ tự"
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertList(true)}
                  className="p-1.5 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-all flex items-center justify-center"
                  title="Danh sách có thứ tự"
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={isLocked ? "Bài viết đã bị khóa, không thể thêm bình luận." : (isAuthenticated ? placeholderAuth : placeholderGuest)}
              disabled={submittingComment || isLocked}
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </>
        ) : (
          <div className="w-full rounded-lg border border-outline-variant bg-slate-50/50 px-3 py-2 text-sm text-slate-800 min-h-[80px] max-h-[250px] overflow-y-auto break-words prose max-w-none animate-fadeIn">
            {content.trim() ? (
              <SafeMarkdown content={content} />
            ) : (
              <span className="text-slate-400 italic">Nội dung xem trước trống...</span>
            )}
          </div>
        )}

        {/* Formatting Tips */}
        {isAuthenticated && !isLocked && editorMode === 'write' && (
          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/50 p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary font-bold">info</span>
              Hỗ trợ định dạng bình luận:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 font-medium mt-1">
              <div>• In đậm: <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">**chữ**</code></div>
              <div>• In nghiêng: <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">*chữ*</code></div>
              <div>• Code inline: <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">`code`</code></div>
              <div>• Link: <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">[Tên](URL)</code></div>
              <div className="col-span-2 mt-1.5 border-t border-slate-200/40 pt-1.5">• <strong>Khối Code:</strong> Xuống dòng rồi dùng 3 dấu nháy ngược <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">```yaml</code> (tên ngôn ngữ), viết code, rồi kết thúc bằng <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">```</code> ở dòng mới.</div>
            </div>
          </div>
        )}

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
              userReputation={userReputation}
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
