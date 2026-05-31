import React from 'react';
import { NavLink } from 'react-router-dom';

const LeftSidebar = () => {
    return (
        <aside className="w-full lg:w-56 flex-shrink-0">
            <nav className="sticky top-[calc(4rem+1.5rem)] flex flex-col py-stack-lg gap-stack-sm bg-surface dark:bg-background border-r border-outline-variant dark:border-outline h-[calc(100vh-4rem-1.5rem)] hidden lg:flex">
                <div className="px-4 pb-2">
                    <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1">CỘNG ĐỒNG</h2>
                    <p className="font-body-sm text-body-sm text-secondary">Diễn đàn cộng đồng</p>
                </div>
                <div className="flex flex-col gap-1">
                    <NavLink
                        to="/home"
                        className={({ isActive }) =>
                            `py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors ${
                                isActive
                                    ? 'bg-surface-container-high text-primary font-bold border-r-4 border-primary'
                                    : 'text-secondary'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        <span>Trang chủ</span>
                    </NavLink>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">help</span>
                        <span>Câu hỏi</span>
                    </a>
                    <NavLink
                        to="/tags"
                        className={({ isActive }) =>
                            `py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors ${
                                isActive
                                    ? 'bg-surface-container-high text-primary font-bold border-r-4 border-primary'
                                    : 'text-secondary'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                        <span>Thẻ</span>
                    </NavLink>
                    <NavLink
                        to="/reports/history"
                        className={({ isActive }) =>
                            `py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors ${
                                isActive
                                    ? 'bg-surface-container-high text-primary font-bold border-r-4 border-primary'
                                    : 'text-secondary'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        <span>Báo cáo</span>
                    </NavLink>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        <span>Người dùng</span>
                    </a>
                </div>
                <div className="mt-8 px-4 pb-2">
                    <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1">NHÓM</h2>
                </div>
                <div className="flex flex-col gap-1">
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">work</span>
                        <span>Nhóm</span>
                    </a>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">group_work</span>
                        <span>Tập thể</span>
                    </a>
                </div>
            </nav>
        </aside>
    );
};

export default LeftSidebar;
