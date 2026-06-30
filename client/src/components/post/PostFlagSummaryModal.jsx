import React, { useEffect } from 'react';

const flagTypeLabelMap = {
  spam: 'Spam quảng cáo hàng loạt',
  rude_abusive: 'Công kích/Xúc phạm',
  off_topic: 'Lạc chủ đề cộng đồng',
  needs_detail: 'Cần thêm chi tiết hoặc làm rõ',
  needs_focus: 'Cần tập trung vào một vấn đề cụ thể',
  opinion_based: 'Dựa trên quan điểm cá nhân',
  duplicate: 'Trùng bài viết/câu hỏi đã có',
  very_low_quality: 'Chất lượng rất thấp, khó cứu vãn',
  moderator_attention: 'Cần moderator xem thủ công',
};

const postStatusLabelMap = {
  unresolved: 'Đang hiển thị',
  resolved: 'Đã đóng',
  hidden: 'Đang bị ẩn',
  deleted: 'Đã xóa',
};

const postStatusStyleMap = {
  unresolved: 'text-emerald-700 bg-emerald-50/60 border-emerald-250',
  resolved: 'text-amber-700 bg-amber-50/60 border-amber-250',
  hidden: 'text-slate-700 bg-slate-100 border-slate-200',
  deleted: 'text-red-700 bg-red-50 border-red-200',
};

export default function PostFlagSummaryModal({ isOpen, onClose, ownerSummary, loading, error }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalFlags = ownerSummary?.totalFlags || 0;
  const postStatus = ownerSummary?.postStatus || 'unresolved';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default animate-backdrop-fade"
        aria-label="Đóng bảng tổng hợp cờ"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-enter text-slate-800">
        
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-md font-bold text-slate-900 text-center flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600">flag_circle</span>
            Tình trạng cờ báo cáo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-850 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 max-h-[75vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-xs font-semibold">Đang tải thông tin cờ báo cáo...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          ) : ownerSummary ? (
            <>
              {/* General Summary Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl mb-1">flag</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số cờ</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-1">{totalFlags}</span>
                </div>
                
                <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center ${postStatusStyleMap[postStatus] || 'border-slate-200 bg-slate-50'}`}>
                  <span className="material-symbols-outlined text-xl mb-1">
                    {postStatus === 'resolved' ? 'lock' : postStatus === 'hidden' ? 'visibility_off' : postStatus === 'deleted' ? 'delete_forever' : 'check_circle'}
                  </span>
                  <span className="text-[11px] font-bold opacity-75 uppercase tracking-wider">Trạng thái bài</span>
                  <span className="text-xs font-bold mt-1.5">{postStatusLabelMap[postStatus] || postStatus}</span>
                </div>
              </div>

              {/* Flag Breakdown */}
              <div>
                {totalFlags === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-emerald-50/30 border border-emerald-100 rounded-xl p-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-55 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Bài viết của bạn an toàn</h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                      Hiện tại chưa có cờ báo cáo vi phạm nào đối với bài viết này.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider px-1">Chi tiết báo cáo vi phạm</h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/20 overflow-hidden">
                      {Object.entries(ownerSummary.summaryByType || {}).map(([key, value]) => {
                        if (value === 0) return null;
                        return (
                          <div key={key} className="flex items-center justify-between px-4 py-3 text-slate-700 text-xs">
                            <span className="font-semibold leading-5 pr-4">{flagTypeLabelMap[key] || key}</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm shrink-0">
                              {value} cờ
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Informative Note */}
              <div className="text-[11.5px] text-slate-550 bg-slate-50 border border-slate-150 rounded-xl p-3.5 leading-relaxed flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-slate-400">info</span>
                <div>
                  <p className="font-bold text-slate-700">Lưu ý về cờ báo cáo</p>
                  <p className="mt-0.5">Bài viết có thể bị khóa hoặc ẩn tự động nếu tích lũy quá nhiều cờ báo cáo vi phạm từ cộng đồng. Hãy đảm bảo nội dung tuân thủ đúng quy định của diễn đàn.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">Không tìm thấy dữ liệu báo cáo.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
