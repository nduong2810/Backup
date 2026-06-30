import React, { useState, useEffect, useRef } from 'react';
import { updatePostApi } from '../../services/postService';
import { useToast } from '../../context/ToastContext';
import TagSelector from '../common/TagSelector';
import SafeMarkdown from '../common/SafeMarkdown';

export default function EditPostModal({ isOpen, onClose, post, onUpdateSuccess }) {
  const { toast } = useToast();
  const [postType, setPostType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'

  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (isOpen && post) {
      document.body.style.overflow = 'hidden';
      setPostType(post.postType || 'question');
      setTitle(post.title || '');
      setContent(post.content || '');
      setSelectedTags(post.tags || []);
      
      // Initialize media state
      const initialImages = (post.images || []).map((url, idx) => ({
        id: `old-img-${idx}`,
        src: url,
        type: 'old'
      }));
      const initialVideos = (post.videos || []).map((url, idx) => ({
        id: `old-vid-${idx}`,
        src: url,
        type: 'old'
      }));
      setImages(initialImages);
      setVideos(initialVideos);
      setMediaError('');
      setEditorMode('write');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const getNewFilesSize = (newImages, newVideos) => {
    const imagesSize = newImages.filter(x => x.type === 'new').reduce((acc, x) => acc + (x.file?.size || 0), 0);
    const videosSize = newVideos.filter(x => x.type === 'new').reduce((acc, x) => acc + (x.file?.size || 0), 0);
    return imagesSize + videosSize;
  };

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 10) {
      setMediaError('Số lượng hình ảnh đính kèm vượt quá giới hạn cho phép (Tối đa: 10 hình ảnh).');
      return;
    }

    // Check size limit
    const currentNewFilesSize = getNewFilesSize(images, videos);
    const incomingFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentNewFilesSize + incomingFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng các hình ảnh và video tải lên mới vượt quá giới hạn cho phép 50MB.');
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

    if (videos.length + files.length > 5) {
      setMediaError('Số lượng video đính kèm vượt quá giới hạn cho phép (Tối đa: 5 video).');
      return;
    }

    // Check size limit
    const currentNewFilesSize = getNewFilesSize(images, videos);
    const incomingFilesSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentNewFilesSize + incomingFilesSize > 50 * 1024 * 1024) {
      setMediaError('Tổng dung lượng các hình ảnh và video tải lên mới vượt quá giới hạn cho phép 50MB.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length < 10 || cleanTitle.length > 200) {
      toast.error('Tiêu đề bài viết phải có độ dài từ 10 đến 200 ký tự.');
      return;
    }
    if (cleanContent.length < 20 || cleanContent.length > 10000) {
      toast.error('Nội dung chi tiết bài viết phải có độ dài từ 20 đến 10000 ký tự.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', cleanTitle);
      formData.append('content', cleanContent);
      formData.append('postType', postType);
      formData.append('tags', JSON.stringify(selectedTags));

      // Append images
      images.forEach((img) => {
        if (img.type === 'old') {
          formData.append('images', img.src); // old url string
        } else if (img.type === 'new' && img.file) {
          formData.append('images', img.file); // new file object
        }
      });

      // Append videos
      videos.forEach((vid) => {
        if (vid.type === 'old') {
          formData.append('videos', vid.src); // old url string
        } else if (vid.type === 'new' && vid.file) {
          formData.append('videos', vid.file); // new file object
        }
      });

      const response = await updatePostApi(post._id, formData);
      toast.success('Cập nhật bài viết thành công!');
      
      if (onUpdateSuccess) {
        onUpdateSuccess(response.data?.data);
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default animate-backdrop-fade"
        aria-label="Đóng modal"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-enter">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant dark:border-slate-800">
          <h2 className="text-xl font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_document</span>
            Chỉnh sửa bài viết
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          
          {/* Post Type Segmented Control (Disabled during edit to avoid confusion) */}
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-355 mb-2">Loại bài đăng</label>
            <div className="grid grid-cols-2 gap-3 opacity-60">
              <button
                type="button"
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-not-allowed ${
                  postType === 'question'
                    ? 'border-primary bg-primary-fixed/20 text-on-surface-variant ring-2 ring-primary/20'
                    : 'border-outline-variant bg-surface-container-low text-secondary'
                }`}
                disabled
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span className="material-symbols-outlined text-primary">help_center</span>
                  Question (Câu hỏi giải đáp)
                </div>
              </button>

              <button
                type="button"
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-not-allowed ${
                  postType === 'advice'
                    ? 'border-emerald-500 bg-emerald-500/10 text-on-surface-variant ring-2 ring-emerald-500/20'
                    : 'border-outline-variant bg-surface-container-low text-secondary'
                }`}
                disabled
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span className="material-symbols-outlined text-emerald-500 font-semibold">tips_and_updates</span>
                  Advice (Lời khuyên chia sẻ)
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-350 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="Nhập tiêu đề..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-outline-variant bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed"
            />
            <div className="text-right text-[11px] text-secondary mt-1">{title.length}/200 ký tự</div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-on-surface dark:text-slate-350">
                Nội dung chi tiết <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    editorMode === 'write'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Viết
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    editorMode === 'preview'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Xem trước
                </button>
              </div>
            </div>

            {editorMode === 'write' ? (
              <>
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 mb-2 p-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 w-fit">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**', 'chữ in đậm')}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="In đậm (Bold)"
                  >
                    <span className="material-symbols-outlined text-[18px]">format_bold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*', 'chữ in nghiêng')}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="In nghiêng (Italic)"
                  >
                    <span className="material-symbols-outlined text-[18px]">format_italic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('`', '`', 'code inline')}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="Code dòng (Inline Code)"
                  >
                    <span className="material-symbols-outlined text-[18px]">code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('```yaml\n', '\n```', '// viết code tại đây')}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="Khối Code (Code Block)"
                  >
                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('[', '](url)', 'Tên liên kết')}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="Thêm liên kết (Link)"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertList(false)}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="Danh sách không thứ tự"
                  >
                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertList(true)}
                    className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
                    title="Danh sách có thứ tự"
                  >
                    <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  required
                  rows={6}
                  placeholder="Nhập nội dung bài đăng..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-outline-variant bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed font-body-sm animate-fadeIn"
                />
              </>
            ) : (
              <div className="w-full rounded-xl border border-outline-variant bg-slate-50/50 dark:bg-slate-950/30 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-body-sm min-h-[162px] max-h-[300px] overflow-y-auto break-words prose dark:prose-invert max-w-none animate-fadeIn">
                {content.trim() ? (
                  <SafeMarkdown content={content} />
                ) : (
                  <span className="text-slate-400 italic">Nội dung xem trước trống...</span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-350 mb-1.5">
              Từ khóa (Tags)
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              disabled={submitting}
            />
          </div>

          {/* Image & Video attachments */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-container-low transition cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">image</span>
                <span>Thêm hình ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={submitting}
                />
              </label>

              <label className="flex items-center gap-1.5 rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-container-low transition cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                <span>Thêm video</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={submitting}
                />
              </label>
            </div>

            {/* Error Message */}
            {mediaError && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-1.5">
                {mediaError}
              </p>
            )}

            {/* Images Previews list */}
            {images.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Danh sách ảnh ({images.length})</label>
                <div className="flex flex-wrap gap-2.5">
                  {images.map((img) => (
                    <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-outline-variant group">
                      <img src={img.src} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full p-0.5"
                      >
                        <span className="material-symbols-outlined text-[16px] block">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Previews list */}
            {videos.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Danh sách video ({videos.length})</label>
                <div className="flex flex-wrap gap-2.5">
                  {videos.map((vid) => (
                    <div key={vid.id} className="relative w-72 rounded-xl overflow-hidden border border-outline-variant bg-black flex items-center justify-center group">
                      <video src={vid.src} className="w-full h-40 object-contain" controls={false} muted />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(vid.id)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full p-0.5 z-10"
                      >
                        <span className="material-symbols-outlined text-[16px] block">close</span>
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant dark:border-slate-800 flex justify-end gap-3 bg-surface-container-lowest dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
