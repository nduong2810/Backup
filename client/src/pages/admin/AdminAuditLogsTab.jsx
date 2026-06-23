import { useEffect, useMemo, useState } from 'react';
import { getAdminAuditLogs } from '../../services/userService';

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'user_status_update', label: 'Khóa/mở user' },
  { value: 'post_status_update', label: 'Đổi status bài' },
  { value: 'donation_approved', label: 'Duyệt donation' },
  { value: 'donation_rejected', label: 'Từ chối donation' },
];

const TARGET_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả đối tượng' },
  { value: 'user', label: 'User' },
  { value: 'post', label: 'Bài viết' },
  { value: 'donation', label: 'Donation' },
];

const ACTION_LABELS = {
  user_status_update: 'Khóa/mở user',
  post_status_update: 'Đổi status bài',
  donation_approved: 'Duyệt donation',
  donation_rejected: 'Từ chối donation',
};

const ACTION_STYLES = {
  user_status_update: 'border-violet-200 bg-violet-50 text-violet-700',
  post_status_update: 'border-amber-200 bg-amber-50 text-amber-700',
  donation_approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  donation_rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

const TARGET_LABELS = {
  user: 'User',
  post: 'Bài viết',
  donation: 'Donation',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const stateText = (state = {}) => {
  const entries = Object.entries(state || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '—';
  return entries.map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}`).join(' · ');
};

export default function AdminAuditLogsTab({ embedded = false }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
    keyword: appliedKeyword,
    action,
    targetType,
    fromDate,
    toDate,
  }), [pagination.page, pagination.limit, appliedKeyword, action, targetType, fromDate, toDate]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminAuditLogs(query);
      const data = response?.data?.data || {};
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }));
    } catch (loadError) {
      setLogs([]);
      setError(loadError?.response?.data?.message || 'Không thể tải nhật ký quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.keyword, query.action, query.targetType, query.fromDate, query.toDate]);

  const handleSearch = (event) => {
    event?.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedKeyword(keyword.trim());
  };

  const resetDateFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFromDate('');
    setToDate('');
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), pagination.totalPages || 1);
    setPagination((prev) => ({ ...prev, page: safePage }));
  };

  return (
    <section className={embedded ? 'flex flex-col gap-6' : 'mx-auto w-full max-w-[1400px] px-6 py-8 flex flex-col gap-6'}>
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">manage_history</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Nhật ký thao tác quản trị</h1>
              <p className="mt-1.5 text-sm text-slate-500">Theo dõi admin nào khóa user, đổi status bài, duyệt/từ chối donation và lý do xử lý.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bộ lọc nhật ký</p>
          </div>
          <form onSubmit={handleSearch} className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[minmax(240px,1fr),190px,170px,160px,160px,104px]">
            <div className="relative min-w-0">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm admin, đối tượng hoặc lý do..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <select
              value={action}
              onChange={(event) => { setPagination((prev) => ({ ...prev, page: 1 })); setAction(event.target.value); }}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <select
              value={targetType}
              onChange={(event) => { setPagination((prev) => ({ ...prev, page: 1 })); setTargetType(event.target.value); }}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {TARGET_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => { setPagination((prev) => ({ ...prev, page: 1 })); setFromDate(event.target.value); }}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              title="Từ ngày"
            />

            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => { setPagination((prev) => ({ ...prev, page: 1 })); setToDate(event.target.value); }}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              title="Đến ngày"
            />

            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
              Lọc
            </button>
          </form>

          {(fromDate || toDate) && (
            <div className="pt-1">
              <button type="button" onClick={resetDateFilter} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Xóa lọc ngày
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="w-[180px] px-5 py-4">Thời gian</th>
                <th className="w-[220px] px-5 py-4">Admin</th>
                <th className="w-[190px] px-5 py-4">Hành động</th>
                <th className="w-[180px] px-5 py-4">Đối tượng</th>
                <th className="w-[260px] px-5 py-4">Lý do</th>
                <th className="px-5 py-4">Thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-5 py-5"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-40 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-7 w-32 rounded-full bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-36 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-44 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-56 rounded bg-slate-100" /></td>
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <span className="material-symbols-outlined">manage_history</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có nhật ký phù hợp.</p>
                    <p className="mt-1 text-xs text-slate-400">Thử đổi bộ lọc hoặc thực hiện một thao tác quản trị mới.</p>
                  </td>
                </tr>
              )}

              {!loading && logs.map((log) => (
                <tr key={log._id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-5 align-top text-sm font-semibold text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="px-5 py-5 align-top">
                    <p className="max-w-[200px] truncate text-sm font-bold text-slate-800" title={log.actor?.fullName || log.actor?.email || 'Không rõ admin'}>{log.actor?.fullName || 'Không rõ admin'}</p>
                    <p className="max-w-[200px] truncate text-xs text-slate-400" title={log.actor?.email || ''}>{log.actor?.email || '—'}</p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${ACTION_STYLES[log.action] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{TARGET_LABELS[log.targetType] || log.targetType}</p>
                    <p className="mt-1 max-w-[170px] truncate text-sm font-semibold text-slate-700" title={log.targetLabel || log.targetId}>{log.targetLabel || log.targetId}</p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <p className="line-clamp-3 max-w-[240px] text-sm leading-6 text-slate-700" title={log.reason || 'Không có lý do'}>{log.reason || 'Không có lý do'}</p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <div className="space-y-1 text-xs leading-5 text-slate-500">
                      <p><span className="font-bold text-slate-700">Trước:</span> {stateText(log.previousState)}</p>
                      <p><span className="font-bold text-slate-700">Sau:</span> {stateText(log.newState)}</p>
                      {log.ipAddress && <p><span className="font-bold text-slate-700">IP:</span> {log.ipAddress}</p>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">Tổng <span className="text-slate-900">{pagination.total || 0}</span> nhật ký</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => goToPage(pagination.page - 1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Trước</button>
            <span className="text-sm font-bold text-slate-700">{pagination.page || 1} / {pagination.totalPages || 1}</span>
            <button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => goToPage(pagination.page + 1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>
    </section>
  );
}
