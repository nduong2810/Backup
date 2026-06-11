import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminFlagsThunk, adminUpdateFlagStatusThunk } from '../../store/slices/reportSlice';

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'submitted', label: 'Mới gửi' },
  { value: 'received', label: 'Đã tiếp nhận' },
  { value: 'in_review', label: 'Đang xem xét' },
  { value: 'action_taken', label: 'Đã xử lý vi phạm' },
  { value: 'closed', label: 'Đã đóng (không xử lý)' },
  { value: 'retracted', label: 'Đã rút cờ' },
];

const nextStatusOptionsByCurrent = {
  received: [{ value: 'in_review', label: 'Đang xem xét' }],
  in_review: [
    { value: 'action_taken', label: 'Đã xử lý vi phạm' },
    { value: 'closed', label: 'Đã đóng (không xử lý)' },
  ],
};

const outcomeLabelMap = {
  pending: 'Đang chờ xử lý',
  helpful: 'Báo cáo hợp lệ (đã xử lý)',
  declined: 'Không đủ căn cứ xử lý',
  retracted: 'Người dùng đã rút cờ',
};

const statusBadgeClassMap = {
  submitted: 'border-amber-200 bg-amber-50 text-amber-800',
  received: 'border-blue-200 bg-blue-50 text-blue-800',
  in_review: 'border-violet-200 bg-violet-50 text-violet-800',
  action_taken: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-slate-300 bg-slate-100 text-slate-700',
  retracted: 'border-rose-200 bg-rose-50 text-rose-800',
};

const outcomeBadgeClassMap = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  helpful: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  declined: 'border-slate-300 bg-slate-100 text-slate-700',
  retracted: 'border-rose-200 bg-rose-50 text-rose-800',
};

const flagTypeBadgeClassMap = {
  spam: 'border-rose-200 bg-rose-50 text-rose-800',
  rude_abusive: 'border-red-200 bg-red-50 text-red-800',
  off_topic: 'border-orange-200 bg-orange-50 text-orange-800',
  needs_detail: 'border-sky-200 bg-sky-50 text-sky-800',
  needs_focus: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  opinion_based: 'border-purple-200 bg-purple-50 text-purple-800',
  duplicate: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  very_low_quality: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  moderator_attention: 'border-blue-200 bg-blue-50 text-blue-800',
};

const flagTypeOptions = [
  { value: '', label: 'Tất cả loại cờ' },
  { value: 'spam', label: 'Spam' },
  { value: 'rude_abusive', label: 'Công kích/Xúc phạm' },
  { value: 'off_topic', label: 'Lạc chủ đề' },
  { value: 'needs_detail', label: 'Cần thêm chi tiết' },
  { value: 'needs_focus', label: 'Cần tập trung' },
  { value: 'opinion_based', label: 'Quan điểm cá nhân' },
  { value: 'duplicate', label: 'Trùng lặp' },
  { value: 'very_low_quality', label: 'Chất lượng thấp' },
  { value: 'moderator_attention', label: 'Cần moderator' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];

const buildPagination = (current, total) => {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('ellipsis-left');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (current < total - 2) pages.push('ellipsis-right');
  pages.push(total);
  return pages;
};

export default function AdminFlagsPage({ embedded = false }) {
  const dispatch = useDispatch();
  const {
    adminFlags,
    loadingAdminFlags,
    adminFlagsErrorMessage,
    adminUpdatingById,
  } = useSelector((state) => state.reports);

  const [statusFilter, setStatusFilter] = useState('');
  const [flagTypeFilter, setFlagTypeFilter] = useState('');
  const [noteById, setNoteById] = useState({});
  const [nextStatusById, setNextStatusById] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    dispatch(fetchAdminFlagsThunk({ status: statusFilter, flagType: flagTypeFilter }));
  }, [dispatch, statusFilter, flagTypeFilter]);

  const groupedByPost = useMemo(() => {
    const map = new Map();

    for (const ticket of adminFlags) {
      const postId = ticket.post?._id || `unknown-${ticket._id}`;
      if (!map.has(postId)) {
        map.set(postId, {
          postId,
          postTitle: ticket.post?.title || 'Bài viết đã ẩn/xóa',
          items: [],
        });
      }
      map.get(postId).items.push(ticket);
    }

    return Array.from(map.values());
  }, [adminFlags]);

  const total = useMemo(() => adminFlags.length, [adminFlags.length]);
  const totalPages = Math.max(1, Math.ceil(groupedByPost.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedGroups = groupedByPost.slice(start, start + pageSize);
  const paginationItems = buildPagination(safePage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className={embedded ? 'w-full' : 'mx-auto w-full max-w-6xl px-4 py-8'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt cờ báo cáo</h1>
          <p className="mt-1 text-sm text-slate-600">Hàng đợi moderation dành cho quản trị viên.</p>
        </div>
        <p className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700">Tổng: {total}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={flagTypeFilter} onChange={(e) => setFlagTypeFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {flagTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => dispatch(fetchAdminFlagsThunk({ status: statusFilter, flagType: flagTypeFilter }))}
          className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Làm mới
        </button>
      </div>

      {loadingAdminFlags && <p className="mt-6 text-slate-600">Đang tải hàng đợi...</p>}
      {adminFlagsErrorMessage && <p className="mt-4 text-sm text-red-600">{adminFlagsErrorMessage}</p>}

      <div className="mt-6 space-y-4">
        {paginatedGroups.map((group) => (
          <article key={group.postId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">{group.postTitle}</h2>
              <div className="flex items-center gap-2">
                {group.postId && !group.postId.startsWith('unknown-') && (
                  <a
                    href={`/posts/${group.postId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    Xem bài viết
                  </a>
                )}
                <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {group.items.length} cờ
                </span>
              </div>
            </div>

            <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
              {group.items.map((ticket) => {
                const isUpdating = !!adminUpdatingById[ticket._id];
                const allowedNextStatuses = nextStatusOptionsByCurrent[ticket.status] || [];
                const fallbackNextStatus = allowedNextStatuses[0]?.value || '';
                const nextStatus = nextStatusById[ticket._id] || fallbackNextStatus;
                const note = noteById[ticket._id] || '';
                const isFinalState = allowedNextStatuses.length === 0;
                const isSubmittedWaiting = ticket.status === 'submitted';

                return (
                  <div key={ticket._id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-slate-700">
                        <strong>Người báo cáo:</strong> {ticket.reporter?.fullName || 'Ẩn danh'} ({ticket.reporter?.email || 'N/A'})
                      </p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClassMap[ticket.status] || 'border-slate-200 bg-white text-slate-700'}`}>
                        {ticket.statusLabel}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <strong>Loại cờ:</strong>{' '}
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${flagTypeBadgeClassMap[ticket.flagType] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {ticket.flagTypeLabel}
                        </span>
                      </p>
                      <p><strong>Thời gian gửi:</strong> {new Date(ticket.createdAt).toLocaleString('vi-VN')}</p>
                      <p className="sm:col-span-2">
                        <strong>Kết quả:</strong>{' '}
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${outcomeBadgeClassMap[ticket.outcome] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {outcomeLabelMap[ticket.outcome] || ticket.outcome}
                        </span>
                      </p>
                    </div>

                    {ticket.details && <p className="mt-2 text-sm text-slate-700"><strong>Mô tả:</strong> {ticket.details}</p>}

                    {isSubmittedWaiting && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Cờ mới gửi cần chờ đủ 30 phút để tự chuyển sang "Đã tiếp nhận", sau đó admin mới duyệt.
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[180px,1fr,auto]">
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatusById((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                        disabled={isFinalState}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {allowedNextStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>

                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNoteById((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                        placeholder="Ghi chú xử lý..."
                        disabled={isFinalState}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        disabled={isUpdating || isFinalState || !nextStatus}
                        onClick={() => dispatch(adminUpdateFlagStatusThunk({ ticketId: ticket._id, nextStatus, note }))}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}

        {!loadingAdminFlags && groupedByPost.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Không có cờ nào theo bộ lọc hiện tại.</div>
        )}
      </div>

      {!loadingAdminFlags && groupedByPost.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            Trang {safePage}/{totalPages} • {groupedByPost.length} bài viết có cờ
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {paginationItems.map((item) => {
                if (typeof item !== 'number') return <span key={item} className="px-2 text-slate-500">...</span>;
                const active = item === safePage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-10 rounded-sm border px-3 py-2 text-sm ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">mỗi trang</span>
              {PAGE_SIZE_OPTIONS.map((size) => {
                const active = size === pageSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`min-w-10 rounded-sm border px-3 py-2 text-sm ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
