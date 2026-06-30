import React, { useEffect } from 'react';

export default function EditHistoryModal({ isOpen, onClose, history = [], type = 'post', title = 'Lịch sử chỉnh sửa' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Sắp xếp lịch sử từ mới nhất đến cũ nhất
  const sortedHistory = [...history].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default animate-backdrop-fade"
        aria-label="Đóng modal"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-modal-enter">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant dark:border-slate-800">
          <h2 className="text-xl font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">info</span>
              <p className="text-sm">Không có dữ liệu lịch sử chỉnh sửa.</p>
            </div>
          ) : (
            <div className="relative border-l border-outline-variant dark:border-slate-800 ml-4 pl-6 space-y-8">
              {sortedHistory.map((item, index) => (
                <div key={index} className="relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-900 border-2 border-primary text-[10px] text-primary font-bold">
                    {sortedHistory.length - index}
                  </span>

                  {/* History item details */}
                  <div className="bg-surface-container-low dark:bg-slate-950/40 border border-outline-variant dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-sm hover:border-slate-400 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs text-secondary border-b border-outline-variant dark:border-slate-800 pb-2">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Phiên bản cũ
                      </span>
                      <span>{formatDate(item.editedAt)}</span>
                    </div>

                    {/* Post Title */}
                    {type === 'post' && item.title && (
                      <h4 className="font-bold text-on-surface dark:text-slate-100 text-sm">
                        {item.title}
                      </h4>
                    )}

                    {/* Content */}
                    <p className="text-sm text-on-surface-variant dark:text-slate-300 whitespace-pre-line leading-relaxed break-words font-body-sm">
                      {item.content}
                    </p>

                    {/* Tags */}
                    {type === 'post' && item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-0.5 rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-secondary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Images attach */}
                    {item.images && item.images.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-secondary">Hình ảnh đính kèm:</span>
                        <div className="flex flex-wrap gap-2">
                          {item.images.map((url, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-outline-variant hover:opacity-85 transition-opacity"
                            >
                              <img src={url} alt="old-attachment" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos attach */}
                    {item.videos && item.videos.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-secondary">Video đính kèm:</span>
                        <div className="flex flex-wrap gap-2">
                          {item.videos.map((url, vidIdx) => (
                            <a
                              key={vidIdx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-24 h-16 rounded-lg border border-outline-variant bg-black hover:opacity-85 transition-opacity relative group"
                            >
                              <video src={url} className="w-full h-full object-contain" muted controls={false} />
                              <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                                <span className="material-symbols-outlined">play_circle</span>
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant dark:border-slate-800 flex justify-end bg-surface-container-lowest dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
          >
            Đóng lại
          </button>
        </div>

      </div>
    </div>
  );
}
