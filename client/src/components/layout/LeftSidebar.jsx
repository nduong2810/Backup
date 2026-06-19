import React from 'react';
import { NavLink, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ADMIN_TABS = [
    { key: 'overview', label: 'Tổng quan', icon: 'query_stats', tab: null },
    { key: 'donations', label: 'Duyệt bill COD', icon: 'payments', tab: 'donations' },
    { key: 'flags', label: 'Duyệt cờ báo cáo', icon: 'flag', tab: 'flags' },
    { key: 'tags', label: 'Quản lý thẻ tag', icon: 'label', tab: 'tags' },
    { key: 'posts', label: 'Quản lý bài đăng', icon: 'article', tab: 'posts' },
    { key: 'settings', label: 'Cấu hình hệ thống', icon: 'settings', tab: 'settings' },
];

const navLinkClass = ({ isActive }) =>
    `py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors ${
        isActive
            ? 'bg-surface-container-high text-primary font-bold border-r-4 border-primary'
            : 'text-secondary'
    }`;

const LeftSidebar = () => {
    const { user } = useSelector((state) => state.login);
    const isAdmin = user?.role === 'admin';
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Determine which admin tab is active
    const isAdminPage = location.pathname.startsWith('/admin');
    const currentAdminTab = isAdminPage ? (searchParams.get('tab') || 'overview') : null;

    return (
        <aside className="w-full lg:w-56 flex-shrink-0">
            <nav className="sticky top-[calc(4rem+1.5rem)] flex flex-col py-stack-lg gap-stack-sm bg-surface dark:bg-background border-r border-outline-variant dark:border-outline h-[calc(100vh-4rem-1.5rem)] hidden lg:flex overflow-y-auto">
                <div className="px-4 pb-2">
                    <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1">CỘNG ĐỒNG</h2>
                    <p className="font-body-sm text-body-sm text-secondary">Diễn đàn cộng đồng</p>
                </div>
                <div className="flex flex-col gap-1">
                    <NavLink
                        to="/home"
                        className={navLinkClass}
                    >
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        <span>Trang chủ</span>
                    </NavLink>
                    <NavLink
                        to="/tags"
                        className={navLinkClass}
                    >
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                        <span>Thẻ</span>
                    </NavLink>
                    <NavLink
                        to="/reports/history"
                        className={navLinkClass}
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        <span>Báo cáo</span>
                    </NavLink>
                </div>

                {/* Admin Section - Only visible for admins */}
                {isAdmin && (
                    <>
                        <div className="mt-4 px-4 pb-2 border-t border-outline-variant pt-4">
                            <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                                QUẢN TRỊ
                            </h2>
                        </div>
                        <div className="flex flex-col gap-1">
                            {ADMIN_TABS.map((item) => {
                                const href = item.tab
                                    ? `/admin/dashboard?tab=${item.tab}`
                                    : '/admin/dashboard';
                                const isActive = isAdminPage && currentAdminTab === (item.tab || 'overview');

                                return (
                                    <NavLink
                                        key={item.key}
                                        to={href}
                                        className={() =>
                                            `py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors ${
                                                isActive
                                                    ? 'bg-surface-container-high text-primary font-bold border-r-4 border-primary'
                                                    : 'text-secondary'
                                            }`
                                        }
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-primary' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </>
                )}
            </nav>
        </aside>
    );
};

export default LeftSidebar;
