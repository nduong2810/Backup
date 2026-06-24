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
import AdminAuditLogsTab from './AdminAuditLogsTab';

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: 'query_stats' },
  { key: 'donations', label: 'Duyệt bill COD', icon: 'payments' },
  { key: 'all-donations', label: 'Quản lý giao dịch quyên góp', icon: 'receipt_long' },
  { key: 'audit-logs', label: 'Nhật ký quản trị', icon: 'manage_history' },
  { key: 'posts', label: 'Quản lý bài đăng', icon: 'article' },
  { key: 'flags', label: 'Duyệt cờ báo cáo', icon: 'flag' },
  { key: 'users', label: 'Quản lý thành viên', icon: 'group' },
  { key: 'tags', label: 'Quản lý thẻ tag', icon: 'label' },
  { key: 'settings', label: 'Cấu hình hệ thống', icon: 'settings' },
];

const VALID_TABS = TABS.map((tab) => tab.key);
const REFRESHABLE_TABS = ['all-donations', 'audit-logs'];

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const handleTabChange = useCallback((tabKey) => {
    const safeTab = VALID_TABS.includes(tabKey) ? tabKey : 'overview';

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

  const renderOverview = () => {
    if (error) {
      return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        </div>
      );
    }

    if (!stats) {
      return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Không thể tải dữ liệu thống kê.</div>;
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">query_stats</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
              <h1 className="mt-1 text-2xl font-extrabold leading-none text-slate-900">Tổng quan hệ thống</h1>
              <p className="mt-1.5 text-sm text-slate-500">Xem số liệu thống kê tổng quát, hàng đợi cần xử lý và các lối tắt tác vụ quản trị.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thành viên</span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">group</span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">{stats.summary.totalUsers}</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Đăng ký trên diễn đàn</p>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bài viết</span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">description</span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">{stats.summary.totalPosts}</h3>
            <button type="button" onClick={() => handleTabChange('posts')} className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline">Mở quản lý bài đăng</button>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cờ báo cáo</span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">flag</span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900">{stats.summary.pendingFlagsCount}</h3>
            <button type="button" onClick={() => handleTabChange('flags')} className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline">Mở duyệt cờ báo cáo</button>
          </div>

          <div className="min-h-[138px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quỹ ủng hộ</span>
              <span className="material-symbols-outlined shrink-0 text-xl text-slate-300">account_balance_wallet</span>
            </div>
            <h3 className="mt-3 truncate text-xl font-extrabold leading-tight text-slate-900" title={formatCurrency(stats.summary.totalDonationAmount)}>{formatCurrency(stats.summary.totalDonationAmount)}</h3>
            <button type="button" onClick={() => handleTabChange('all-donations')} className="mt-2 text-left text-xs font-bold leading-5 text-primary hover:underline">Mở quản lý giao dịch quyên góp</button>
          </div>
        </div>

        {(stats.summary.pendingFlagsCount > 0 || stats.summary.pendingDonationsCount > 0) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="material-symbols-outlined shrink-0 text-xl text-amber-500">pending_actions</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">Hàng đợi cần xử lý</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  {stats.summary.pendingFlagsCount > 0 && (
                    <button type="button" onClick={() => handleTabChange('flags')} className="font-bold leading-5 text-orange-600 hover:underline">{stats.summary.pendingFlagsCount} cờ báo cáo</button>
                  )}
                  {stats.summary.pendingDonationsCount > 0 && (
                    <button type="button" onClick={() => handleTabChange('donations')} className="font-bold leading-5 text-primary hover:underline">{stats.summary.pendingDonationsCount} bill COD chờ duyệt</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold leading-6 text-slate-800">Lối tắt quản trị</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <button type="button" onClick={() => handleTabChange('donations')} className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-primary">payments</span>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-900">Duyệt bill COD</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Xác nhận giao dịch chuyển khoản thủ công.</p>
            </button>
            <button type="button" onClick={() => handleTabChange('all-donations')} className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-900">Quản lý giao dịch quyên góp</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Theo dõi tất cả VNPAY và COD.</p>
            </button>
            <button type="button" onClick={() => handleTabChange('audit-logs')} className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-primary">manage_history</span>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-900">Nhật ký quản trị</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Xem ai khóa user, đổi status bài và duyệt donation.</p>
            </button>
            <button type="button" onClick={() => handleTabChange('posts')} className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-primary">article</span>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-900">Quản lý bài đăng</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Khóa, ẩn, xóa hoặc khôi phục bài viết.</p>
            </button>
            <button type="button" onClick={() => handleTabChange('flags')} className="min-h-[112px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-primary">flag</span>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-900">Duyệt cờ báo cáo</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Xử lý báo cáo vi phạm từ người dùng.</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const canRefreshActiveTab = REFRESHABLE_TABS.includes(activeTab);

  return (
    <main className="relative mx-auto w-full max-w-[1280px] px-6 pt-2 pb-8 min-w-0 flex-1 flex flex-col gap-6">
      {canRefreshActiveTab && (
        <button
          type="button"
          onClick={() => setRefreshSeed((value) => value + 1)}
          className="absolute right-12 top-8 z-20 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      )}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'donations' && <AdminDonationsPage embedded />}
      {activeTab === 'all-donations' && <AdminAllDonationsTab key={`all-donations-${refreshSeed}`} embedded />}
      {activeTab === 'audit-logs' && <AdminAuditLogsTab key={`audit-logs-${refreshSeed}`} embedded />}
      {activeTab === 'posts' && <AdminPostsTab embedded />}
      {activeTab === 'flags' && <AdminFlagsPage embedded />}
      {activeTab === 'users' && <AdminUsersTab embedded />}
      {activeTab === 'tags' && <AdminTagsTab />}
      {activeTab === 'settings' && <AdminSettingsTab />}
    </main>
  );
}
