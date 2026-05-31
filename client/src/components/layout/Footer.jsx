import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface border-t border-outline-variant mt-auto">
      <div className="max-w-container-max mx-auto px-gutter py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 md:gap-6">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="material-symbols-outlined text-[30px] opacity-80">code</span>
            <span className="font-headline-md text-body-md font-bold text-surface-dim">ITForum</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-body-sm text-body-sm text-outline text-center">
            <a className="hover:text-inverse-on-surface transition-colors" href="#">Về chúng tôi</a>
            <a className="hover:text-inverse-on-surface transition-colors" href="#">Điều khoản dịch vụ</a>
            <a className="hover:text-inverse-on-surface transition-colors" href="#">Chính sách bảo mật</a>
          </nav>

          <div className="font-body-sm text-body-sm text-outline text-center md:text-right">
            © 2026 IT Forum. Bảo lưu mọi quyền.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
