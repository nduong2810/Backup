import { useEffect, useMemo, useState } from 'react';
import AppPagination from '../../components/common/AppPagination';
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

const formatStateValue = (key, value) => {
  if (key === 'status') {
    const postLabels = {
      unresolved: 'Đang hiển thị',
      resolved: 'Đã khóa',
      hidden: 'Đang ẩn',
      deleted: 'Đã xóa',
      active: 'Hoạt động',
      banned: 'Bị khóa',
      deactivated: 'Vô hiệu',
      pending_delete: 'Chờ xóa',
      pending_review: 'Chờ duyệt',
      pending_payment: 'Chờ thanh toán',
      completed: 'Hoàn thành',
      rejected: 'Từ chối'
    };
    return postLabels[value] || value;
  }
  if (key === 'isActive') {
    return value ? 'Hoạt động' : 'Bị khóa';
  }
  if (key === 'statusReason' || key === 'reason') {
    return value;
  }
  if (key === 'deletedAt' || key === 'completedAt') {
    return value ? new Date(value).toLocaleDateString('vi-VN') : '—';
  }
  return typeof value === 'boolean' ? (value ? 'Có' : 'Không') : String(value);
};

const formatKeyLabel = (key) => {
  const keys = {
    status: 'Trạng thái',
    isActive: 'Hoạt động',
    statusReason: 'Lý do',
    reason: 'Lý do',
    deletedAt: 'Ngày xóa',
    deletedBy: 'Người xóa',
    completedAt: 'Ngày hoàn thành',
    amount: 'Số tiền',
  };
  return keys[key] || key;
};

const renderStateInfo = (state) => {
  const entries = Object.entries(state || {}).filter(([key, val]) => val !== undefined && val !== null && val !== '');
  if (!entries.length) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          <span className="text-slate-400">{formatKeyLabel(key)}:</span>
          <span>{formatStateValue(key, val)}</span>
        </span>
      ))}
    </div>
  );
};

export default function AdminAuditLogsTab({ embedded = false }) {
  const [colWidths, setColWidths] = useState({
    time: 170,
    admin: 220,
    action: 180,
    target: 220,
    reason: 280,
    change: 330,
  });

  const handleMouseDown = (colKey, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = colWidths[colKey];

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX);
      setColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (colKey) => {
    const cells = document.querySelectorAll(`[data-col="${colKey}"]`);
    let maxWidth = 80;
    cells.forEach((cell) => {
      const contentEl = cell.querySelector('.w-max');
      if (contentEl) {
        const contentWidth = contentEl.scrollWidth + 42;
        if (contentWidth > maxWidth) maxWidth = contentWidth;
      } else {
        const textWidth = cell.scrollWidth;
        if (textWidth > maxWidth) maxWidth = textWidth;
      }
    });
    const finalWidth = Math.min(600, Math.max(80, maxWidth));
    setColWidths((prev) => ({
      ...prev,
      [colKey]: finalWidth,
    }));
  };

  const totalWidth = useMemo(() => Object.values(colWidths).reduce((a, b) => a + b, 0), [colWidths]);

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
        <div className="overflow-x-auto scrollbar-custom pb-2">
          <table className="table-fixed w-full divide-y divide-slate-100" style={{ minWidth: `${totalWidth}px` }}>
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.time}px` }} data-col="time">
                  <div className="w-max">Thời gian</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('time', e)}
                    onDoubleClick={() => handleDoubleClick('time')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.admin}px` }} data-col="admin">
                  <div className="w-max">Admin</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('admin', e)}
                    onDoubleClick={() => handleDoubleClick('admin')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.action}px` }} data-col="action">
                  <div className="w-max">Hành động</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('action', e)}
                    onDoubleClick={() => handleDoubleClick('action')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.target}px` }} data-col="target">
                  <div className="w-max">Đối tượng</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('target', e)}
                    onDoubleClick={() => handleDoubleClick('target')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.reason}px` }} data-col="reason">
                  <div className="w-max">Lý do</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('reason', e)}
                    onDoubleClick={() => handleDoubleClick('reason')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.change}px` }} data-col="change">
                  <div className="w-max">Thay đổi</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('change', e)}
                    onDoubleClick={() => handleDoubleClick('change')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-5 py-5" data-col="time"><div className="h-4 w-28 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5" data-col="admin"><div className="h-4 w-36 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5" data-col="action"><div className="h-7 w-28 rounded-full bg-slate-100" /></td>
                  <td className="px-5 py-5" data-col="target"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5" data-col="reason"><div className="h-4 w-40 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5" data-col="change"><div className="h-4 w-56 rounded bg-slate-100" /></td>
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
                  <td className="whitespace-nowrap px-5 py-5 align-top text-xs font-semibold text-slate-500 overflow-hidden" data-col="time">
                    <div className="w-max">{formatDateTime(log.createdAt)}</div>
                  </td>
                  <td className="px-5 py-5 align-top min-w-0 overflow-hidden" data-col="admin">
                    <div className="w-full min-w-0 break-words">
                      <p className="text-sm font-bold text-slate-800" title={log.actor?.fullName || log.actor?.email || 'Không rõ admin'}>{log.actor?.fullName || 'Không rõ admin'}</p>
                      <p className="text-xs text-slate-400" title={log.actor?.email || ''}>{log.actor?.email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top overflow-hidden" data-col="action">
                    <div className="w-max">
                      <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${ACTION_STYLES[log.action] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top min-w-0 overflow-hidden" data-col="target">
                    <div className="w-full min-w-0 break-words">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{TARGET_LABELS[log.targetType] || log.targetType}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700" title={log.targetLabel || log.targetId}>{log.targetLabel || log.targetId}</p>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top min-w-0 overflow-hidden" data-col="reason">
                    <div className="w-full min-w-0 break-words font-normal">
                      <p className="line-clamp-3 text-sm leading-5 text-slate-700" title={log.reason || 'Không có lý do'}>{log.reason || 'Không có lý do'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top min-w-0 overflow-hidden" data-col="change">
                    <div className="w-full min-w-0 break-words">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-start gap-1">
                          <span className="font-bold text-slate-700 w-12 shrink-0">Trước:</span>
                          <div className="flex-1 min-w-0">{renderStateInfo(log.previousState)}</div>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="font-bold text-slate-700 w-12 shrink-0">Sau:</span>
                          <div className="flex-1 min-w-0">{renderStateInfo(log.newState)}</div>
                        </div>
                        {log.ipAddress && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">lan</span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <AppPagination
            page={pagination.page}
            totalPages={pagination.totalPages || 1}
            onPageChange={goToPage}
            limit={pagination.limit}
            limitOptions={[10, 20, 50]}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
          <div className="mt-2 text-center sm:text-left text-xs font-semibold text-slate-500">
            Tổng <span className="text-slate-900">{pagination.total || 0}</span> nhật ký
          </div>
        </div>
      </div>
    </section>
  );
}
