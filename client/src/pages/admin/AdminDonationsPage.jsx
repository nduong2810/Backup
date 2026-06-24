import { useEffect, useMemo, useState, useCallback } from 'react';
import { approveCodDonationApi, fetchAdminDonationsApi, rejectCodDonationApi } from '../../services/donationService';

const statusLabels = {
  pending_review: 'Chờ duyệt bill',
  pending_payment: 'Chờ thanh toán VNPAY',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
};

const statusClasses = {
  pending_review: 'border-amber-200 bg-amber-50 text-amber-800',
  pending_payment: 'border-blue-200 bg-blue-50 text-blue-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};

const defaultRejectReason = 'Bill không hợp lệ hoặc chưa nhận được chuyển khoản';

export default function AdminDonationsPage({ embedded = false }) {
  const [donations, setDonations] = useState([]);
  const [status, setStatus] = useState('pending_review');
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [rejectReason, setRejectReason] = useState(defaultRejectReason);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchAdminDonationsApi({ status, paymentMethod: 'cod' });
      setDonations(response.data?.data || []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể tải danh sách bill COD.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDonations();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDonations]);

  const summary = useMemo(() => {
    return donations.reduce(
      (acc, item) => {
        acc.count += 1;
        acc.amount += Number(item.amount || 0);
        return acc;
      },
      { count: 0, amount: 0 }
    );
  }, [donations]);

  const openApproveModal = (donation) => {
    setErrorMessage('');
    setSuccessMessage('');
    setReviewModal({ type: 'approve', donation });
  };

  const openRejectModal = (donation) => {
    setErrorMessage('');
    setSuccessMessage('');
    setRejectReason(defaultRejectReason);
    setReviewModal({ type: 'reject', donation });
  };

  const closeReviewModal = () => {
    if (approvingId || rejectingId) return;
    setReviewModal(null);
  };

  const handleApprove = async () => {
    if (!reviewModal?.donation?._id) return;

    const donationId = reviewModal.donation._id;
    setApprovingId(donationId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await approveCodDonationApi(donationId);
      setSuccessMessage('Đã duyệt bill COD thành công.');
      setReviewModal(null);
      await loadDonations();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể duyệt bill COD.');
    } finally {
      setApprovingId('');
    }
  };

  const handleReject = async () => {
    if (!reviewModal?.donation?._id) return;

    const donationId = reviewModal.donation._id;
    const finalReason = rejectReason.trim() || 'Admin không duyệt bill COD';

    setRejectingId(donationId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await rejectCodDonationApi(donationId, finalReason);
      setSuccessMessage('Đã từ chối bill COD thành công.');
      setReviewModal(null);
      await loadDonations();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể từ chối bill COD.');
    } finally {
      setRejectingId('');
    }
  };

  const modalDonation = reviewModal?.donation;
  const isApproveModal = reviewModal?.type === 'approve';
  const isRejectModal = reviewModal?.type === 'reject';
  const modalBusy = !!approvingId || !!rejectingId;

  return (
    <div className={embedded ? 'flex flex-col gap-6 w-full' : 'mx-auto w-full max-w-7xl px-4 py-8 flex flex-col gap-6'}>
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">payments</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Duyệt bill ủng hộ COD</h1>
              <p className="mt-1.5 text-sm text-slate-500">Quản lý các giao dịch chuyển khoản thủ công đang chờ admin xác nhận.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={loadDonations}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-55 hover:text-slate-900 active:bg-slate-100"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">Trạng thái</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="pending_review">Chờ duyệt bill</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="rejected">Đã từ chối</option>
            <option value="">Tất cả COD</option>
          </select>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Số giao dịch</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary.count}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng tiền</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(summary.amount)}</p>
        </div>
      </div>

      {successMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p>}
      {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{errorMessage}</p>}
      {loading && <p className="text-sm text-slate-600">Đang tải danh sách bill...</p>}

      <div className="space-y-4">
        {!loading && donations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Không có giao dịch COD nào phù hợp bộ lọc hiện tại.
          </div>
        )}

        {donations.map((donation) => {
          const billImage = donation.billImage || '';
          const canReview = donation.paymentMethod === 'cod' && donation.status === 'pending_review';
          const rejectReasonText = donation.gatewayResponse?.rejectReason || '';

          return (
            <article key={donation._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-[280px,1fr]">
                <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                  {billImage ? (
                    <a href={billImage} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={billImage} alt="Bill chuyển khoản" className="h-64 w-full object-contain" />
                    </a>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                      Không có ảnh bill
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900">{formatCurrency(donation.amount)}</h2>
                      <p className="mt-1 text-sm text-slate-600 break-words">{donation.postSnapshot?.title || donation.post?.title || 'Bài viết'}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[donation.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                      {statusLabels[donation.status] || donation.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <p className="break-all"><strong>Người ủng hộ:</strong> {donation.donor?.fullName || donation.donorSnapshot?.fullName || 'N/A'} ({donation.donor?.email || 'N/A'})</p>
                    <p className="break-all"><strong>Tác giả nhận:</strong> {donation.author?.fullName || donation.authorSnapshot?.fullName || 'N/A'} ({donation.author?.email || 'N/A'})</p>
                    <p><strong>Phương thức:</strong> {donation.paymentMethod?.toUpperCase()}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(donation.createdAt).toLocaleString('vi-VN')}</p>
                    {donation.completedAt && <p><strong>Hoàn thành:</strong> {new Date(donation.completedAt).toLocaleString('vi-VN')}</p>}
                    {donation.rejectedAt && <p><strong>Ngày từ chối:</strong> {new Date(donation.rejectedAt).toLocaleString('vi-VN')}</p>}
                    {donation.approvedBy && <p><strong>Admin xử lý:</strong> {donation.approvedBy?.fullName || donation.approvedBy?.email || 'N/A'}</p>}
                  </div>

                  {donation.note && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-words whitespace-pre-wrap">
                      <strong>Ghi chú:</strong> {donation.note}
                    </div>
                  )}

                  {rejectReasonText && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 break-words whitespace-pre-wrap">
                      <strong>Lý do không duyệt:</strong> {rejectReasonText}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {donation.post && (
                      <a
                        href={`/posts/${donation.post._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        Xem bài viết
                      </a>
                    )}
                    {billImage && (
                      <a
                        href={billImage}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mở bill lớn
                      </a>
                    )}
                    {canReview && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApproveModal(donation)}
                          disabled={approvingId === donation._id || rejectingId === donation._id}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approvingId === donation._id ? 'Đang duyệt...' : 'Duyệt bill'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(donation)}
                          disabled={approvingId === donation._id || rejectingId === donation._id}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {rejectingId === donation._id ? 'Đang từ chối...' : 'Không duyệt bill'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {isApproveModal ? 'Xác nhận duyệt bill COD' : 'Không duyệt bill COD'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {modalDonation?.postSnapshot?.title || modalDonation?.post?.title || 'Giao dịch ủng hộ'}
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p><strong>Số tiền:</strong> {formatCurrency(modalDonation?.amount)}</p>
                <p className="mt-1"><strong>Người ủng hộ:</strong> {modalDonation?.donor?.fullName || modalDonation?.donorSnapshot?.fullName || 'N/A'}</p>
                <p className="mt-1"><strong>Tác giả nhận:</strong> {modalDonation?.author?.fullName || modalDonation?.authorSnapshot?.fullName || 'N/A'}</p>
              </div>

              {isApproveModal && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Sau khi duyệt, giao dịch sẽ chuyển sang trạng thái <strong>Đã hoàn thành</strong> và tác giả được ghi nhận lượt ủng hộ.
                </p>
              )}

              {isRejectModal && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Lý do không duyệt</label>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Nhập lý do không duyệt bill"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={modalBusy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              {isApproveModal && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={modalBusy}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvingId ? 'Đang duyệt...' : 'Xác nhận duyệt'}
                </button>
              )}
              {isRejectModal && (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={modalBusy}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rejectingId ? 'Đang từ chối...' : 'Xác nhận không duyệt'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
