import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminDashboardStats } from '../../services/userService';
import AdminDonationsPage from './AdminDonationsPage';
import AdminFlagsPage from './AdminFlagsPage';
import AdminSettingsTab from './AdminSettingsTab';
import AdminTagsTab from './AdminTagsTab';
import AdminPostsTab from './AdminPostsTab';
import AdminUsersTab from './AdminUsersTab';
import AdminAllDonationsTab from './AdminAllDonationsTab';

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: 'query_stats' },
  { key: 'donations', label: 'Duyệt bill COD', icon: 'payments' },
  { key: 'all-donations', label: 'Quản lý giao dịch quyên góp', icon: 'receipt_long' },
  { key: 'posts', label: 'Quản lý bài đăng', icon: 'article' },
  { key: 'flags', label: 'Duyệt cờ báo cáo', icon: 'flag' },
  { key: 'users', label: 'Quản lý thành viên', icon: 'group' },
  { key: 'tags', label: 'Quản lý thẻ tag', icon: 'label' },
  { key: 'settings', label: 'Cấu hình hệ thống', icon: 'settings' },
];

const VALID_TABS = TABS.map((tab) => tab.key);

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = useCallback((tabKey) => {
    const safeTab = VALID_TABS.includes(tabKey) ? tabKey : 'overview';

    setSidebarOpen(false);

    if (safeTab === 'overview') {
      setSearchParams({}, { replace: false });
      return;
    }

    setSearchParams({ tab: safeTab }, { replace: false });
  }, [setSearchParams]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminDashboardStats();

      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setError('Không thể lấy dữ liệu thống kê hệ thống.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

  const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

  const formatShortAmount = (amount) => {
    const value = Number(amount || 0);

    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;

    return value;
  };

  const pendingBadge = (key) => {
    if (!stats?.summary) return 0;
    if (key === 'donations') return stats.summary.pendingDonationsCount || 0;
    if (key === 'flags') return stats.summary.pendingFlagsCount || 0;
    return 0;
  };

  const renderMiniBarChart = (timeline = []) => {
    if (!timeline.length) return null;

    const maxValue = Math.max(
      ...timeline.map((item) => Number(item.donationAmount || 0)),
      50000
    );

    return (
      <div className="flex h-44 items-end gap-3 rounded-2xl bg-slate-50 px-4 py-4">
        {timeline.map((item) => {
          const amount = Number(item.donationAmount || 0);
          const height = Math.max(8, Math.round((amount / maxValue) * 128));

          return (
            <div
              key={`${item.year}-${item.month}`}
              className="group flex flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex h-32 w-full items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-xl bg-primary/80 transition group-hover:bg-primary"
                  style={{ height }}
                />
                <span className="absolute -top-7 hidden rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white group-hover:block">
                  {formatShortAmount(amount)}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverview = () => {
    if (error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Không thể tải dữ liệu thống kê.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Thành viên
              </span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">
                group
              </span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">
              {stats.summary.totalUsers}
            </h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              Đăng ký trên diễn đàn
            </p>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bài viết
              </span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">
                description
              </span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">
              {stats.summary.totalPosts}
            </h3>
            <button
              type="button"
              onClick={() => handleTabChange('posts')}
              className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline"
            >
              Mở quản lý bài đăng
            </button>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cờ báo cáo
              </span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">
                flag
              </span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">
              {stats.summary.pendingFlagsCount}
            </h3>
            <button
              type="button"
              onClick={() => handleTabChange('flags')}
              className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline"
            >
              Mở duyệt cờ báo cáo
            </button>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quỹ ủng hộ
              </span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">
                account_balance_wallet
              </span>
            </div>
            <h3
              className="mt-3 truncate text-xl font-extrabold leading-tight text-slate-900"
              title={formatCurrency(stats.summary.totalDonationAmount)}
            >
              {formatCurrency(stats.summary.totalDonationAmount)}
            </h3>
            <button
              type="button"
              onClick={() => handleTabChange('all-donations')}
              className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline"
            >
              Mở quản lý giao dịch quyên góp
            </button>
          </div>
        </div>

        {(stats.summary.pendingFlagsCount > 0 || stats.summary.pendingDonationsCount > 0) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="material-symbols-outlined shrink-0 text-xl text-amber-500">
                pending_actions
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  Hàng đợi cần xử lý
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  {stats.summary.pendingFlagsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('flags')}
                      className="font-bold leading-5 text-orange-600 hover:underline"
                    >
                      {stats.summary.pendingFlagsCount} cờ báo cáo
                    </button>
                  )}

                  {stats.summary.pendingDonationsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('donations')}
                      className="font-bold leading-5 text-primary hover:underline"
                    >
                      {stats.summary.pendingDonationsCount} bill COD chờ duyệt
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-6 text-slate-800">
                  Doanh thu ủng hộ
                </h3>
                <p className="mt-0.5 text-xs leading-5 text-slate-400">
                  Dòng tiền quyên góp qua VNPAY/COD
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-400">
                VND
              </span>
            </div>
            {renderMiniBarChart(stats.timeline)}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold leading-6 text-slate-800">
              Lối tắt quản trị
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleTabChange('donations')}
                className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <span className="material-symbols-outlined text-primary">
                  payments
                </span>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-900">
                  Duyệt bill COD
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Xác nhận giao dịch chuyển khoản thủ công.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('all-donations')}
                className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-900">
                  Quản lý giao dịch quyên góp
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Theo dõi tất cả VNPAY và COD.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('posts')}
                className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <span className="material-symbols-outlined text-primary">
                  article
                </span>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-900">
                  Quản lý bài đăng
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Khóa, ẩn, xóa hoặc khôi phục bài viết.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('flags')}
                className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <span className="material-symbols-outlined text-primary">
                  flag
                </span>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-900">
                  Duyệt cờ báo cáo
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Xử lý báo cáo vi phạm từ người dùng.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-8 pt-2 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex flex-col gap-6 md:flex-row lg:gap-8">
        <aside className="w-full shrink-0 md:w-72">
          <div className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl text-primary">
                admin_panel_settings
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-6 text-slate-900">
                  Trang quản trị
                </h1>
                <p className="mt-0.5 text-xs font-medium leading-5 text-slate-400">
                  Giám sát & phê duyệt
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm md:hidden"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="material-symbols-outlined shrink-0 text-base">
                {TABS.find((tab) => tab.key === activeTab)?.icon}
              </span>
              <span className="truncate">
                {TABS.find((tab) => tab.key === activeTab)?.label}
              </span>
            </span>
            <span
              className="material-symbols-outlined shrink-0 text-sm transition-transform"
              style={{ transform: sidebarOpen ? 'rotate(180deg)' : '' }}
            >
              expand_more
            </span>
          </button>

          <nav className={`space-y-2 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const badge = pendingBadge(tab.key);

              return (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex min-h-[58px] w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-transparent bg-white text-slate-600 shadow-sm hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                      isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="min-w-0 flex-1 leading-5">
                    {tab.label}
                  </span>

                  {badge > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                        isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 hidden rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lối tắt
            </p>
            <a
              href="/"
              className="mt-3 flex items-center gap-2.5 rounded-xl px-1 py-1.5 text-sm font-medium leading-5 text-slate-500 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined shrink-0 text-base">
                home
              </span>
              <span>Về trang chủ</span>
            </a>
            <a
              href="/admin/profile"
              className="mt-1 flex items-center gap-2.5 rounded-xl px-1 py-1.5 text-sm font-medium leading-5 text-slate-500 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined shrink-0 text-base">
                person
              </span>
              <span>Hồ sơ Admin</span>
            </a>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'donations' && <AdminDonationsPage embedded />}
          {activeTab === 'all-donations' && <AdminAllDonationsTab embedded />}
          {activeTab === 'posts' && <AdminPostsTab embedded />}
          {activeTab === 'flags' && <AdminFlagsPage embedded />}
          {activeTab === 'users' && <AdminUsersTab embedded />}
          {activeTab === 'tags' && <AdminTagsTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
}