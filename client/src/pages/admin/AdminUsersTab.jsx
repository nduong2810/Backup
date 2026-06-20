import { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getAdminUsers, getAdminUserDetail, toggleAdminUserStatus } from '../../services/userService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả thành viên' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã bị khóa' },
];

const REPUTATION_RANKS = [
  { min: 1, max: 49, label: 'Newbie', color: 'text-slate-500', bg: 'bg-slate-100' },
  { min: 50, max: 199, label: 'Member', color: 'text-sky-600', bg: 'bg-sky-50' },
  { min: 200, max: 499, label: 'Contributor', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { min: 500, max: 999, label: 'Trusted', color: 'text-violet-600', bg: 'bg-violet-50' },
  { min: 1000, max: 1999, label: 'Expert', color: 'text-amber-600', bg: 'bg-amber-50' },
  { min: 2000, max: Infinity, label: 'Elite', color: 'text-rose-600', bg: 'bg-rose-50' },
];

const getRank = (rep) => {
  const r = REPUTATION_RANKS.find((rank) => rep >= rank.min && rep <= rank.max);
  return r || REPUTATION_RANKS[0];
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const AVATAR_FALLBACK = 'default-avatar.png';
const getAvatarUrl = (avatar) => {
  if (!avatar || avatar === AVATAR_FALLBACK) return null;
  return avatar;
};

const getRiskEvaluation = (stats, user) => {
  const confirmedViolations = stats.confirmedViolationsCount || 0;
  const deletedPosts = stats.deletedPostCount || 0;
  const hiddenPosts = stats.hiddenPostCount || 0;
  const reportRate = stats.reportRate || 0;
  const totalDownvotes = stats.totalDownvotes || 0;
  const reputation = user?.reputation || 1;
  const reportCount = stats.reportCount || 0;

  let score = 0;
  const reasons = [];

  if (confirmedViolations > 0) {
    score += confirmedViolations * 3;
    reasons.push(`Có ${confirmedViolations} báo cáo vi phạm đã được Admin duyệt (action taken).`);
  }
  if (deletedPosts > 0) {
    score += deletedPosts * 2.5;
    reasons.push(`Có ${deletedPosts} bài đăng đã bị xóa khỏi hệ thống.`);
  }
  if (hiddenPosts > 0) {
    score += hiddenPosts * 1.5;
    reasons.push(`Có ${hiddenPosts} bài đăng đang bị ẩn.`);
  }
  if (reportRate >= 30 && stats.postCount > 1) {
    score += 2;
    reasons.push(`Tỷ lệ bài viết bị báo cáo cao (${reportRate}%).`);
  }
  if (totalDownvotes > 5) {
    score += Math.min(3, Math.floor(totalDownvotes / 3));
    reasons.push(`Nhận ${totalDownvotes} lượt downvote từ cộng đồng.`);
  }
  if (reputation <= 5 && reportCount > 3) {
    score += 2;
    reasons.push(`Danh tiếng thấp nhưng bị báo cáo nhiều lần (${reportCount} lượt).`);
  }

  let level = 'safety';
  let title = 'An toàn';
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let icon = 'verified_user';
  let recommendation = 'Thành viên hoạt động bình thường. Không có dấu hiệu vi phạm cần xử lý.';

  if (score >= 7) {
    level = 'high';
    title = 'Rủi ro cao (Khuyên khóa)';
    color = 'text-rose-700 bg-rose-50 border-rose-200';
    icon = 'gavel';
    recommendation = 'Hệ thống đề xuất KHÓA TÀI KHOẢN do có nhiều vi phạm hoặc nội dung độc hại liên tục.';
  } else if (score >= 4) {
    level = 'medium';
    title = 'Rủi ro trung bình';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    icon = 'warning';
    recommendation = 'Cân nhắc gửi cảnh báo hoặc khóa tạm thời nếu phát hiện hành vi cố ý spam/công kích.';
  } else if (score > 0) {
    level = 'low';
    title = 'Rủi ro thấp';
    color = 'text-sky-700 bg-sky-50 border-sky-200';
    icon = 'info';
    recommendation = 'Theo dõi thêm hoạt động. Nhắc nhở nếu nội dung chưa nghiêm trọng.';
  }

  return { score, level, title, color, icon, recommendation, reasons };
};

export default function AdminUsersTab({ embedded = false }) {
  // ===== List state =====
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ===== Action state =====
  const [updatingId, setUpdatingId] = useState('');
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState('');

  // ===== Detail modal state =====
  const [detailUser, setDetailUser] = useState(null);
  const [detailStats, setDetailStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ===== Confirm dialog state =====
  const [confirmAction, setConfirmAction] = useState(null); // { userId, fullName, isActive (target) }
  const isModalOpen = Boolean(confirmAction || detailUser || detailLoading);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  // ===== Query =====
  const query = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
    keyword: appliedKeyword,
    status,
  }), [pagination.page, pagination.limit, appliedKeyword, status]);

  // ===== Fetch users =====
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminUsers(query);
      const data = response?.data?.data || {};
      setUsers(Array.isArray(data.users) ? data.users : []);
      setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }));
    } catch (fetchError) {
      setUsers([]);
      setError(fetchError?.response?.data?.message || 'Không thể tải danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ===== Auto-hide success message =====
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ===== Handlers =====
  const handleApplySearch = (event) => {
    event?.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedKeyword(keyword.trim());
  };

  const handleStatusFilter = (event) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setStatus(event.target.value);
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), pagination.totalPages || 1);
    setPagination((prev) => ({ ...prev, page: safePage }));
  };

  // ===== View user detail =====
  const handleViewDetail = async (userId) => {
    setDetailLoading(true);
    setDetailUser(null);
    setDetailStats(null);
    try {
      const response = await getAdminUserDetail(userId);
      const data = response?.data?.data || {};
      setDetailUser(data.user || null);
      setDetailStats(data.stats || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải thông tin thành viên.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailUser(null);
    setDetailStats(null);
  };

  // ===== Toggle user status =====
  const handleConfirmToggle = (user, targetIsActive) => {
    setConfirmAction({
      userId: user._id,
      fullName: user.fullName,
      isActive: targetIsActive,
    });
  };

  const executeToggle = async () => {
    if (!confirmAction) return;
    const { userId, isActive } = confirmAction;
    setConfirmAction(null);
    setUpdatingId(userId);
    setError('');

    try {
      const response = await toggleAdminUserStatus(userId, isActive);
      const message = response?.data?.message || (isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      setSuccessMsg(message);

      // Update local state
      setUsers((current) =>
        current.map((item) =>
          item._id === userId ? { ...item, isActive } : item
        )
      );

      // Update detail modal if open
      if (detailUser && detailUser._id === userId) {
        setDetailUser((prev) => ({ ...prev, isActive }));
      }

      setRecentlyUpdatedId(userId);
      window.setTimeout(() => setRecentlyUpdatedId(''), 900);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Không thể cập nhật trạng thái thành viên.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <section className={embedded ? 'space-y-5' : 'mx-auto w-full max-w-[1280px] px-6 py-8'}>
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">User Management</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Quản lý thành viên</h2>
            <p className="mt-1 text-sm text-slate-500">Xem danh sách, theo dõi hoạt động và quản lý trạng thái tài khoản thành viên.</p>
          </div>

          <form onSubmit={handleApplySearch} className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:w-72">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <select
                value={status}
                onChange={handleStatusFilter}
                className="h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                expand_more
              </span>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
              Lọc
            </button>
          </form>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed divide-y divide-slate-100">
            <colgroup>
              <col className="w-[27%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[19%]" />
            </colgroup>
            <thead className="bg-slate-50/80">
              <tr className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 text-left">Thành viên</th>
                <th className="px-5 py-4">Chuyên ngành</th>
                <th className="px-5 py-4">Reputation</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 rounded bg-slate-100" />
                          <div className="h-3 w-44 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="mx-auto h-4 w-16 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-7 w-28 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="mx-auto h-9 w-32 rounded-full bg-slate-100" /></td>
                  </tr>
                ))
              }

              {/* Empty state */}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Không có thành viên phù hợp.</p>
                    <p className="mt-1 text-xs text-slate-400">Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
                  </td>
                </tr>
              )}

              {/* User rows */}
              {!loading && users.map((user) => {
                const isUpdating = updatingId === user._id;
                const isRecent = recentlyUpdatedId === user._id;
                const rank = getRank(user.reputation || 1);
                const avatarUrl = getAvatarUrl(user.avatar);

                return (
                  <tr key={user._id} className={`transition-all duration-300 hover:bg-slate-50 ${isRecent ? 'bg-emerald-50/60' : ''}`}>
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={user.fullName}
                              className="h-9 w-9 rounded-full object-cover border border-slate-200"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div
                            className={`h-9 w-9 rounded-full bg-primary/10 text-primary items-center justify-center text-sm font-bold ${avatarUrl ? 'hidden' : 'flex'}`}
                          >
                            {(user.fullName || '?').charAt(0).toUpperCase()}
                          </div>
                          {/* Active dot */}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${user.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/users/${user._id}`}
                            className="text-sm font-bold text-slate-900 truncate hover:text-primary transition-colors"
                            title={`Mở hồ sơ công khai của ${user.fullName}`}
                          >
                            {user.fullName}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Major */}
                    <td className="px-5 py-4 text-center">
                      <span className="block truncate text-sm font-medium text-slate-600" title={user.major || 'Chưa cập nhật'}>
                        {user.major || '—'}
                      </span>
                    </td>

                    {/* Reputation */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-extrabold text-slate-800">{user.reputation || 1}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rank.bg} ${rank.color}`}>
                          {rank.label}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                        user.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                      </span>
                    </td>

                    {/* Join date */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-slate-500 font-medium">{formatDate(user.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-nowrap justify-center gap-2">
                        {/* View detail */}
                        <button
                          type="button"
                          onClick={() => handleViewDetail(user._id)}
                          className="group inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover:rotate-6">visibility</span>
                          Chi tiết
                        </button>

                        {/* Lock/Unlock */}
                        {user.isActive ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleConfirmToggle(user, false)}
                            className="group inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-rose-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-6'}`}>
                              {isUpdating ? 'progress_activity' : 'lock'}
                            </span>
                            {isUpdating ? 'Đang xử lý' : 'Khóa'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleConfirmToggle(user, true)}
                            className="group inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-emerald-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-6'}`}>
                              {isUpdating ? 'progress_activity' : 'lock_open'}
                            </span>
                            {isUpdating ? 'Đang xử lý' : 'Mở khóa'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Tổng <span className="text-slate-900">{pagination.total || 0}</span> thành viên
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => goToPage(pagination.page - 1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm font-bold text-slate-700">
              {pagination.page || 1} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => goToPage(pagination.page + 1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* ===== Confirm Dialog ===== */}
      {confirmAction && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className={`material-symbols-outlined text-xl font-bold ${confirmAction.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {confirmAction.isActive ? 'lock_open' : 'lock'}
              </span>
              {confirmAction.isActive ? 'Xác nhận mở khóa tài khoản?' : 'Xác nhận khóa tài khoản?'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {confirmAction.isActive ? (
                <>Bạn có chắc chắn muốn mở khóa tài khoản <span className="font-extrabold text-slate-800">{confirmAction.fullName}</span>? Thành viên này sẽ có thể đăng nhập và sử dụng diễn đàn bình thường.</>
              ) : (
                <>Bạn có chắc chắn muốn khóa tài khoản <span className="font-extrabold text-slate-800">{confirmAction.fullName}</span>? Thành viên này sẽ <span className="font-bold text-rose-600">không thể đăng nhập</span> cho đến khi được mở khóa.</>
              )}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={executeToggle}
                className={`flex-1 rounded-xl py-2 text-sm font-bold text-white shadow-sm transition-all ${
                  confirmAction.isActive
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmAction.isActive ? 'Mở khóa' : 'Khóa tài khoản'}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== User Detail Modal ===== */}
      {(detailUser || detailLoading) && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={closeDetail}
        >
          <div
            className="scrollbar-hide w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
                Thông tin thành viên
              </h3>
              <button
                onClick={closeDetail}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-slate-100" />
                    <div className="h-4 w-56 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-20 rounded-xl bg-slate-100" />
                  <div className="h-20 rounded-xl bg-slate-100" />
                  <div className="h-20 rounded-xl bg-slate-100" />
                </div>
              </div>
            ) : detailUser ? (
              <div className="p-6 space-y-5">
                {/* User profile card */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    {getAvatarUrl(detailUser.avatar) ? (
                      <img
                        src={getAvatarUrl(detailUser.avatar)}
                        alt={detailUser.fullName}
                        className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className={`h-16 w-16 rounded-full bg-primary/10 text-primary items-center justify-center text-xl font-bold border-2 border-slate-200 ${getAvatarUrl(detailUser.avatar) ? 'hidden' : 'flex'}`}
                    >
                      {(detailUser.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${detailUser.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900">{detailUser.fullName}</h4>
                    <p className="text-sm text-slate-500">{detailUser.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
                        detailUser.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${detailUser.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {detailUser.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                      </span>
                      {(() => {
                        const rank = getRank(detailUser.reputation || 1);
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rank.bg} ${rank.color}`}>
                            {rank.label} · {detailUser.reputation || 1} điểm
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Số điện thoại</p>
                    <p className="text-sm font-semibold text-slate-700">{detailUser.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Chuyên ngành</p>
                    <p className="text-sm font-semibold text-slate-700">{detailUser.major || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Giới thiệu bản thân</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{detailUser.bio || 'Chưa cập nhật.'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ngày tham gia</p>
                    <p className="text-sm font-semibold text-slate-700">{formatDate(detailUser.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cập nhật lần cuối</p>
                    <p className="text-sm font-semibold text-slate-700">{formatDate(detailUser.updatedAt)}</p>
                  </div>
                </div>

                {/* Risk evaluation panel */}
                {detailStats && (
                  (() => {
                    const risk = getRiskEvaluation(detailStats, detailUser);
                    return (
                      <div className={`rounded-2xl border p-4 space-y-3 ${risk.color}`}>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">{risk.icon}</span>
                            Đánh giá rủi ro tài khoản
                          </h5>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border border-current bg-white/50">
                            {risk.title}
                          </span>
                        </div>
                        
                        {risk.reasons.length > 0 ? (
                          <ul className="text-xs font-medium space-y-1 list-disc pl-4 opacity-90">
                            {risk.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs font-medium opacity-90">Không phát hiện dấu hiệu vi phạm hoặc báo cáo tiêu cực nào.</p>
                        )}
                        
                        <div className="border-t border-current/10 pt-2 text-xs font-extrabold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          Khuyến nghị: {risk.recommendation}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Activity stats */}
                {detailStats && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                        Thống kê hoạt động
                      </h5>
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-primary text-xl">article</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailStats.postCount}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Tổng bài</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-emerald-500 text-xl">chat_bubble</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailStats.commentCount}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Bình luận</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-amber-500 text-xl">thumb_up</span>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            👍{detailStats.totalUpvotes || 0} / 👎{detailStats.totalDownvotes || 0}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Upvotes / Downvotes</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-indigo-500 text-xl">workspace_premium</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailUser.reputation || 1}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Danh tiếng</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">policy</span>
                        Chỉ số kiểm duyệt nội dung
                      </h5>
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-rose-500 text-xl">flag</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailStats.reportCount}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Lượt bị báo cáo</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-amber-600 text-xl">gavel</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailStats.confirmedViolationsCount || 0}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Vi phạm đã xử lý</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-slate-500 text-xl">visibility_off</span>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {detailStats.hiddenPostCount || 0} ẩn / {detailStats.deletedPostCount || 0} xóa
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Bài bị ẩn & xóa</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                          <span className="material-symbols-outlined text-violet-500 text-xl">percent</span>
                          <p className="mt-1 text-base font-extrabold text-slate-900">{detailStats.reportRate || 0}%</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Tỷ lệ bị báo cáo</p>
                        </div>
                      </div>
                    </div>

                    {detailStats.lastPostAt && (
                      <p className="text-xs text-slate-400 italic">
                        Bài viết gần nhất đăng lúc: {formatDate(detailStats.lastPostAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons in modal */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  {detailUser.isActive ? (
                    <button
                      onClick={() => { closeDetail(); handleConfirmToggle(detailUser, false); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-700 transition-all hover:bg-rose-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      Khóa tài khoản
                    </button>
                  ) : (
                    <button
                      onClick={() => { closeDetail(); handleConfirmToggle(detailUser, true); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      Mở khóa tài khoản
                    </button>
                  )}
                  <button
                    onClick={closeDetail}
                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
