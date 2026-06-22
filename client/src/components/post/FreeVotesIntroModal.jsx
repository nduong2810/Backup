import React from 'react';

export default function FreeVotesIntroModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button 
        type="button" 
        onClick={onClose} 
        className="absolute inset-0 bg-black/50 transition-opacity cursor-default" 
        aria-label="Đóng"
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl overflow-hidden p-6 text-center transform transition-all flex flex-col items-center animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
          title="Đóng"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>

        {/* Visual Graphic Representation similar to the StackOverflow dialog in screenshot */}
        <div className="flex items-center justify-center gap-2 mb-6 mt-2 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/30 w-full">
          <div className="flex flex-col items-center gap-1 opacity-80 scale-90">
            <div className="p-1 rounded-full border border-outline-variant text-outline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 4l-8 8h5v8h6v-8h5z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-outline">25</span>
          </div>
          
          <div className="h-8 w-[1px] bg-outline-variant/40 mx-2" />
          
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-extrabold text-primary leading-none">1<span className="text-sm font-normal text-outline">/5</span></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">Bình chọn</span>
          </div>

          <div className="h-8 w-[1px] bg-outline-variant/40 mx-2" />

          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 4l-8 8h5v8h6v-8h5z" />
            </svg>
            <span className="text-[11px] font-bold">Free Vote</span>
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-xl font-bold text-on-surface tracking-wide mb-2">
          Cảm ơn bình chọn của bạn!
        </h3>
        <p className="text-sm font-medium text-primary mb-5">
          Bạn hiện có 5 lượt bình chọn miễn phí mỗi tuần.
        </p>

        {/* Bullet Points */}
        <div className="text-left bg-surface-container-low/30 border border-outline-variant/40 rounded-xl p-4 w-full mb-6 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Đặc quyền lượt miễn phí:
          </span>
          <ul className="flex flex-col gap-2.5 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 leading-none font-bold">check_circle</span>
              <span>Điểm vote vẫn tính vào tổng điểm bài viết để xếp hạng nội dung hay.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 leading-none font-bold">check_circle</span>
              <span>KHÔNG tăng hay giảm điểm danh tiếng (reputation) của tác giả (tránh spam buff chéo).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 leading-none font-bold">check_circle</span>
              <span>Bản thân bạn cũng không bị trừ điểm uy tín khi downvote.</span>
            </li>
          </ul>
        </div>

        {/* Call to action message */}
        <p className="text-xs text-secondary leading-relaxed mb-6 px-1">
          Hãy tiếp tục giúp đỡ cộng đồng tìm kiếm các nội dung bổ ích, chất lượng cao! Đóng góp bài đăng/câu trả lời hay để nhận upvote, nâng điểm danh tiếng cá nhân và mở khóa toàn bộ quyền bình chọn chính thức.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-primary text-white hover:bg-primary-hover font-semibold rounded-xl transition-all duration-200 cursor-pointer active:scale-98 shadow-sm flex items-center justify-center"
        >
          Đã hiểu, tiếp tục
        </button>
      </div>
    </div>
  );
}
