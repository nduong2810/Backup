import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminFlagsThunk, adminUpdateFlagStatusThunk } from '../../store/slices/reportSlice';

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'submitted', label: 'Mới gửi' },
  { value: 'received', label: 'Đã tiếp nhận' },
  { value: 'in_review', label: 'Đang xem xét' },
  { value: 'action_taken', label: 'Đã xử lý' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'retracted', label: 'Đã rút cờ' },
];

const nextStatusOptions = [
  { value: 'received', label: 'Đã tiếp nhận' },
  { value: 'in_review', label: 'Đang xem xét' },
  { value: 'action_taken', label: 'Đã xử lý' },
  { value: 'closed', label: 'Đã đóng' },
];

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

export default function AdminFlagsPage() {
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

  useEffect(() => {
    dispatch(fetchAdminFlagsThunk({ status: statusFilter, flagType: flagTypeFilter }));
  }, [dispatch, statusFilter, flagTypeFilter]);

  const total = useMemo(() => adminFlags.length, [adminFlags.length]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
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
        {adminFlags.map((ticket) => {
          const isUpdating = !!adminUpdatingById[ticket._id];
          const nextStatus = nextStatusById[ticket._id] || 'received';
          const note = noteById[ticket._id] || '';
          const isFinalState = ['retracted', 'closed', 'action_taken'].includes(ticket.status);

          return (
            <article key={ticket._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{ticket.post?.title || 'Bài viết đã ẩn/xóa'}</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{ticket.statusLabel}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 sm:grid-cols-2">
                <p><strong>Người báo cáo:</strong> {ticket.reporter?.fullName || 'Ẩn danh'} ({ticket.reporter?.email || 'N/A'})</p>
                <p><strong>Loại cờ:</strong> {ticket.flagTypeLabel}</p>
                <p><strong>Kết quả:</strong> {ticket.outcome}</p>
                <p><strong>Thời gian gửi:</strong> {new Date(ticket.createdAt).toLocaleString('vi-VN')}</p>
              </div>

              {ticket.post?._id && (
                <div className="mt-3">
                  <a
                    href={`/posts/${ticket.post._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    Xem bài viết
                  </a>
                </div>
              )}

              {ticket.details && <p className="mt-2 text-sm text-slate-700"><strong>Mô tả:</strong> {ticket.details}</p>}

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[180px,1fr,auto]">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatusById((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                  disabled={isFinalState}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {nextStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                  disabled={isUpdating || isFinalState}
                  onClick={() => dispatch(adminUpdateFlagStatusThunk({ ticketId: ticket._id, nextStatus, note }))}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </article>
          );
        })}

        {!loadingAdminFlags && adminFlags.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Không có cờ nào theo bộ lọc hiện tại.</div>
        )}
      </div>
    </div>
  );
}
