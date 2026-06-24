import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface border-t border-outline-variant mt-auto">
      <div className="max-w-container-max mx-auto px-gutter py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-center">
          {/* Column 1: Brand & Copyright */}
          <div className="flex flex-col gap-3 items-start justify-self-start">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-primary leading-none">code</span>
              <span className="font-headline-md text-headline-md font-bold text-white">ITForum</span>
            </div>
            <p className="font-body-sm text-body-sm text-outline max-w-[280px]">
              Diễn đàn học tập và chia sẻ kiến thức CNTT dành cho sinh viên.
            </p>
            <div className="font-body-sm text-body-sm text-outline mt-1">
              © 2026 IT Forum. Bảo lưu mọi quyền.
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-3 items-start justify-self-start md:justify-self-center">
            <h3 className="font-headline-sm text-body-md font-bold text-white uppercase tracking-wider">Khám phá</h3>
            <nav className="flex flex-col gap-2 font-body-sm text-body-sm text-outline items-start">
              <a className="hover:text-inverse-on-surface transition-colors" href="#">Về chúng tôi</a>
              <a className="hover:text-inverse-on-surface transition-colors" href="#">Điều khoản dịch vụ</a>
              <a className="hover:text-inverse-on-surface transition-colors" href="#">Chính sách bảo mật</a>
            </nav>
          </div>

          {/* Column 3: Contact Support */}
          <div className="flex flex-col gap-3 items-start justify-self-start md:justify-self-end">
            <h3 className="font-headline-sm text-body-md font-bold text-white uppercase tracking-wider">Liên hệ hỗ trợ</h3>
            <div className="flex flex-col gap-2 font-body-sm text-body-sm text-outline items-start">
              <a href="mailto:23110198@student.hcmute.edu.vn" className="hover:text-inverse-on-surface transition-colors">23110198@student.hcmute.edu.vn</a>
              <a href="mailto:23110278@student.hcmute.edu.vn" className="hover:text-inverse-on-surface transition-colors">23110278@student.hcmute.edu.vn</a>
              <a href="mailto:23110355@student.hcmute.edu.vn" className="hover:text-inverse-on-surface transition-colors">23110355@student.hcmute.edu.vn</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
