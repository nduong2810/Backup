import React, { useEffect } from 'react';

const reportReasons = [
  { value: 'spam', label: 'Spam quảng cáo hoặc nội dung rác' },
  { value: 'rude_abusive', label: 'Ngôn từ công kích, quấy rối hoặc thô tục' },
  { value: 'off_topic', label: 'Lạc đề, không mang tính chất thảo luận học tập' },
  { value: 'copyright_infringement', label: 'Chia sẻ tài liệu lậu, leak khóa học hoặc vi phạm bản quyền' },
  { value: 'false_info_scam', label: 'Thông tin sai sự thật, lừa đảo hoặc gian lận' },
  { value: 'adult_content', label: 'Hình ảnh hoặc nội dung nhạy cảm, 18+' },
  { value: 'dont_want_to_see', label: 'Tôi không muốn nhìn thấy nội dung này' },
];

export default function ReportCommentModal({ isOpen, onClose, comment, onSubmitReport }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectReason = (reasonValue) => {
    onSubmitReport(reasonValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default animate-backdrop-fade"
        aria-label="Đóng báo cáo"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-enter text-slate-800">
        
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-md font-bold text-slate-900 text-center">Báo cáo</h2>
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
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 leading-snug">Tại sao bạn báo cáo bình luận này?</h3>
            <p className="text-[12.5px] text-slate-500 leading-relaxed font-body-sm">
              Báo cáo này giúp ban quản trị nhận biết và xử lý bình luận vi phạm tiêu chuẩn cộng đồng hoặc nội dung không lành mạnh trên diễn đàn.
            </p>

            <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed font-body-sm font-semibold flex items-start gap-2 mt-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
              <div>
                <p className="font-bold text-amber-900">Lưu ý quan trọng</p>
                <p className="mt-0.5">Bạn chỉ có thể rút cờ báo cáo này trong vòng 30 phút kể từ lúc gửi. Sau 30 phút, cờ sẽ được tiếp nhận và không thể rút lại.</p>
              </div>
            </div>
          </div>

          {/* List of Predefined Reasons */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20">
            {reportReasons.map((reason) => (
              <button
                key={reason.value}
                type="button"
                onClick={() => handleSelectReason(reason.value)}
                className="w-full flex items-center justify-between text-left px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-all group"
              >
                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-950 transition-colors leading-5 pr-4">
                  {reason.label}
                </span>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all text-[18px]">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
