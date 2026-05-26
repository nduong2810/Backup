import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyReportTicketsThunk, retractReportThunk } from '../../store/slices/reportSlice';

const statusClassMap = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  received: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  action_taken: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-300',
  retracted: 'bg-rose-50 text-rose-700 border-rose-200',
};

const outcomeLabelMap = {
  pending: 'Đang chờ xử lý',
  helpful: 'Báo cáo hợp lệ',
  declined: 'Không đủ căn cứ xử lý',
  retracted: 'Bạn đã rút cờ',
};

const PAGE_SIZE_OPTIONS = [15, 30, 50];

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

export default function ReportHistoryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loadingTickets, ticketsErrorMessage, actionLoadingById } = useSelector((state) => state.reports);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    dispatch(fetchMyReportTicketsThunk());
  }, [dispatch]);

  const groupedByPost = useMemo(() => {
    const map = new Map();

    for (const ticket of tickets) {
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
  }, [tickets]);

  const totalPages = Math.max(1, Math.ceil(groupedByPost.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedGroups = groupedByPost.slice(start, start + pageSize);
  const paginationItems = buildPagination(safePage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Quay lại
      </button>

      <h1 className="text-2xl font-bold text-slate-900">Lịch sử cờ báo cáo</h1>
      <p className="mt-2 text-sm text-slate-600">Theo dõi trạng thái xử lý các cờ bạn đã gửi.</p>

      {loadingTickets && <p className="mt-6 text-slate-600">Đang tải dữ liệu...</p>}
      {ticketsErrorMessage && <p className="mt-4 text-sm text-red-600">{ticketsErrorMessage}</p>}

      {!loadingTickets && tickets.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          Bạn chưa có cờ báo cáo nào.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {paginatedGroups.map((group) => (
          <article key={group.postId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">{group.postTitle}</h2>
              <div className="flex items-center gap-2">
                {group.postId && !group.postId.startsWith('unknown-') && (
                  <Link
                    to={`/posts/${group.postId}`}
                    className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    Xem bài viết
                  </Link>
                )}
                <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {group.items.length} cờ
                </span>
              </div>
            </div>

            <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
              {group.items.map((ticket) => {
                const isLoading = !!actionLoadingById[ticket._id];
                const statusClass = statusClassMap[ticket.status] || 'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <div key={ticket._id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-slate-700"><strong>Loại cờ:</strong> {ticket.flagTypeLabel}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                        {ticket.statusLabel}
                      </span>
                    </div>

                    {ticket.details && <p className="mt-1 text-sm text-slate-700"><strong>Mô tả:</strong> {ticket.details}</p>}
                    <p className="mt-1 text-sm text-slate-700">
                      <strong>Kết quả:</strong> {outcomeLabelMap[ticket.outcome] || ticket.outcome}
                    </p>

                    <ol className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
                      {(ticket.history || []).map((step, idx) => (
                        <li key={`${ticket._id}-${idx}`} className="text-sm text-slate-700">
                          <p className="font-medium">{step.note}</p>
                          <p className="text-xs text-slate-500">{new Date(step.createdAt).toLocaleString('vi-VN')}</p>
                        </li>
                      ))}
                    </ol>

                    {ticket.retractable && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => dispatch(retractReportThunk(ticket._id))}
                        className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? 'Đang xử lý...' : 'Rút cờ'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {!loadingTickets && groupedByPost.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            Trang {safePage}/{totalPages} • {groupedByPost.length} bài đã báo cáo
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
                Next
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">per page</span>
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
