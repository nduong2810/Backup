import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPostApi } from '../../services/postService';
import { useToast } from '../../context/ToastContext';
import TagSelector from '../common/TagSelector';
import SafeMarkdown from '../common/SafeMarkdown';

const CREATE_POST_DRAFT_KEY = 'itforum:create-post-draft:v1';

const readDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(CREATE_POST_DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
};

const removeDraft = () => {
  localStorage.removeItem(CREATE_POST_DRAFT_KEY);
};

const formatDraftTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function CreatePostModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [postType, setPostType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  const [manualDraftSavedAt, setManualDraftSavedAt] = useState('');
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

  const resetForm = () => {
    setPostType('question');
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setImages([]);
    setVideos([]);
    setImageFiles([]);
    setVideoFiles([]);
    setMediaError('');
    setDraftNotice('');
    setManualDraftSavedAt('');
    setEditorMode('write');
  };

  const hasAnyInput = () => Boolean(
    title.trim()
    || content.trim()
    || selectedTags.length > 0
    || postType !== 'question'
    || images.length > 0
    || videos.length > 0
    || imageFiles.length > 0
    || videoFiles.length > 0,
  );

  const hasDraftText = () => Boolean(
    title.trim()
    || content.trim()
    || selectedTags.length > 0
    || postType !== 'question',
  );

  const saveDraft = ({ showToast = false } = {}) => {
    if (!hasDraftText()) {
      removeDraft();
      setManualDraftSavedAt('');
      if (showToast) toast.warning('Chưa có nội dung chữ để lưu nháp.');
      return false;
    }

    const savedAt = new Date().toISOString();
    localStorage.setItem(CREATE_POST_DRAFT_KEY, JSON.stringify({
      postType,
      title,
      content,
      selectedTags,
      savedAt,
    }));
    setManualDraftSavedAt(savedAt);
    if (showToast) toast.success('Đã lưu nháp bài viết.');
    return true;
  };

  const handleRequestClose = () => {
    if (submitting) return;

    if (hasAnyInput()) {
      setShowCloseConfirm(true);
      return;
    }

    onClose();
  };

  const handleSaveDraftAndClose = () => {
    const saved = saveDraft({ showToast: true });
    setShowCloseConfirm(false);
    if (saved) onClose();
  };

  const handleDiscardAndClose = () => {
    removeDraft();
    resetForm();
    setShowCloseConfirm(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const draft = readDraft();
      const formIsEmpty = !title && !content && selectedTags.length === 0 && images.length === 0 && videos.length === 0;
      if (draft && formIsEmpty) {
        setPostType(draft.postType || 'question');
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setSelectedTags(draft.selectedTags || []);
        setDraftNotice(`Đã khôi phục bản nháp lưu lúc ${formatDraftTime(draft.savedAt)}.`);
        setManualDraftSavedAt(draft.savedAt || '');
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
    // Chỉ chạy khi mở/đóng modal để không ghi đè nội dung đang nhập.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setTimeout(() => {
      if (hasDraftText()) {
        saveDraft();
      } else {
        removeDraft();
        setManualDraftSavedAt('');
      }
    }, 800);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postType, title, content, selectedTags]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageFiles.length + files.length > 10) {
      setMediaError('Số lượng hình ảnh đính kèm vượt quá giới hạn cho phép (Tối đa: 10 hình ảnh).');
      return;
    }

    // Check combined size
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
        setImages((prev) => [...prev, reader.result]);
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

    // Check combined size
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
        setVideos((prev) => [...prev, { src: reader.result, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveVideo = (index) => {
    setVideos((prev) => prev.filter((_, idx) => idx !== index));
    setVideoFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

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

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      videoFiles.forEach((file) => {
        formData.append('videos', file);
      });

      const response = await createPostApi(formData);

      removeDraft();
      resetForm();
      toast.success('Đăng bài viết thành công!');
      onClose();

      const newPostId = response.data?.data?._id;
      if (newPostId) {
        navigate(`/posts/${newPostId}`);
      } else {
        navigate('/home');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo bài đăng.';
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
        onClick={handleRequestClose}
        disabled={submitting}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default animate-backdrop-fade"
        aria-label="Đóng modal"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-enter">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              Tạo bài viết mới
            </h2>
            {manualDraftSavedAt && (
              <p className="mt-1 text-xs text-secondary">
                Bản nháp đã lưu lúc {formatDraftTime(manualDraftSavedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={submitting}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {draftNotice && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold leading-5 text-sky-800">
              {draftNotice} Ảnh/video đã chọn trước đó không được khôi phục vì trình duyệt không cho lưu file nháp.
            </div>
          )}
          
          {/* Post Type Segmented Control */}
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-350 mb-2">Loại bài đăng</label>
            <div className="grid grid-cols-2 gap-3">
              
              <button
                type="button"
                onClick={() => setPostType('question')}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                  postType === 'question'
                    ? 'border-primary bg-primary-fixed/20 text-on-surface-variant ring-2 ring-primary/20'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span className="material-symbols-outlined text-primary">help_center</span>
                  Question (Câu hỏi giải đáp)
                </div>
                <span className="text-[11px] mt-1 leading-normal opacity-85">
                  Đăng câu hỏi để cộng đồng giải đáp. Tương tác bằng Upvote/Downvote và nhận Reply.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('advice')}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                  postType === 'advice'
                    ? 'border-emerald-500 bg-emerald-500/10 text-on-surface-variant ring-2 ring-emerald-500/20'
                    : 'border-outline-variant bg-surface-container-low text-secondary hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span className="material-symbols-outlined text-emerald-500 font-semibold">tips_and_updates</span>
                  Advice (Lời khuyên chia sẻ)
                </div>
                <span className="text-[11px] mt-1 leading-normal opacity-85">
                  Chia sẻ bài viết kiến thức, mẹo hay hữu ích. Tương tác bằng Like/Dislike và nhận Comment.
                </span>
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
              placeholder="Nhập tiêu đề ngắn gọn, rõ nghĩa..."
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
                  placeholder="Miêu tả chi tiết vấn đề của bạn..."
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
            {/* Formatting Tips */}
            <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 p-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary font-bold">info</span>
                Hỗ trợ định dạng bài viết:
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 font-medium mt-1">
                <div>• In đậm: <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">**chữ**</code></div>
                <div>• In nghiêng: <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">*chữ*</code></div>
                <div>• Code inline: <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">`code`</code></div>
                <div>• Link: <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">[Tên](URL)</code></div>
                <div className="col-span-2 mt-1.5 border-t border-slate-200/40 dark:border-slate-800/50 pt-1.5">• <strong>Khối Code:</strong> Xuống dòng rồi dùng 3 dấu nháy ngược <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">```yaml</code> (tên ngôn ngữ), viết code, rồi kết thúc bằng <code className="bg-slate-200/60 dark:bg-slate-800/85 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600 dark:text-rose-400">```</code> ở dòng mới.</div>
              </div>
            </div>
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
                <label className="block text-xs font-semibold text-secondary mb-1">Danh sách ảnh đã chọn ({images.length})</label>
                <div className="flex flex-wrap gap-2.5">
                  {images.map((imgBase64, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-outline-variant group">
                      <img src={imgBase64} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
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
                <label className="block text-xs font-semibold text-secondary mb-1">Danh sách video đã chọn ({videos.length})</label>
                <div className="flex flex-wrap gap-2.5">
                  {videos.map((vid, index) => (
                    <div key={index} className="relative w-72 rounded-xl overflow-hidden border border-outline-variant bg-black flex items-center justify-center group">
                      <video src={vid.src} className="w-full h-40 object-contain" controls={false} muted />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
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
        <div className="px-6 py-4 border-t border-outline-variant dark:border-slate-800 flex flex-col gap-3 bg-surface-container-lowest dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-secondary">
            Nháp tự lưu khi bạn nhập tiêu đề, nội dung hoặc tag.
          </p>
          <div className="flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => saveDraft({ showToast: true })}
              disabled={submitting}
              className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors disabled:cursor-not-allowed"
            >
              Lưu nháp
            </button>
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={submitting}
              className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="whitespace-nowrap px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Đăng bài</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setShowCloseConfirm(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Tiếp tục nhập"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined">draft</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bạn đang nhập bài viết</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Nếu rời modal ngay, nội dung đang nhập có thể bị mất. Bạn có thể lưu nháp để quay lại viết tiếp sau.
                </p>
                {(images.length > 0 || videos.length > 0) && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    Lưu nháp chỉ giữ tiêu đề, nội dung, tag và loại bài. Ảnh/video đã chọn sẽ không được khôi phục sau khi đóng modal.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="whitespace-nowrap rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tiếp tục nhập
              </button>
              <button
                type="button"
                onClick={handleDiscardAndClose}
                className="whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Thoát không lưu
              </button>
              <button
                type="button"
                onClick={handleSaveDraftAndClose}
                className="whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/95"
              >
                Lưu nháp và thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}