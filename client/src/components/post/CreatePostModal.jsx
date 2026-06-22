import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPostApi } from '../../services/postService';
import { useToast } from '../../context/ToastContext';

export default function CreatePostModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [postType, setPostType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    setMediaError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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
    e.preventDefault();
    if (title.trim().length < 10) {
      toast.error('Tiêu đề bài viết phải có độ dài từ 10 đến 200 ký tự.');
      return;
    }
    if (content.trim().length < 20) {
      toast.error('Nội dung chi tiết bài viết phải có độ dài từ 20 đến 10000 ký tự.');
      return;
    }

    setSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('postType', postType);
      formData.append('tags', JSON.stringify(tags));

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      videoFiles.forEach((file) => {
        formData.append('videos', file);
      });

      const response = await createPostApi(formData);

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
            Tạo bài viết mới
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
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-350 mb-1.5">
              Nội dung chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              placeholder="Miêu tả chi tiết vấn đề của bạn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-outline-variant bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed font-body-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-350 mb-1.5">
              Từ khóa (Tags)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: javascript, reactjs, nodejs (phân cách bằng dấu phẩy)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-outline-variant bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed"
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
  );
}
