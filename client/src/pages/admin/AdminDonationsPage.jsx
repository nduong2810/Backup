import { useEffect, useMemo, useState } from 'react';
import { approveCodDonationApi, fetchAdminDonationsApi } from '../../services/donationService';

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

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [status, setStatus] = useState('pending_review');
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadDonations = async () => {
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
  };

  useEffect(() => {
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  const handleApprove = async (donationId) => {
    if (!window.confirm('Duyệt bill COD này và chuyển giao dịch sang trạng thái hoàn thành?')) return;

    setApprovingId(donationId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await approveCodDonationApi(donationId);
      setSuccessMessage('Đã duyệt bill COD thành công.');
      await loadDonations();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể duyệt bill COD.');
    } finally {
      setApprovingId('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt bill ủng hộ COD</h1>
          <p className="mt-1 text-sm text-slate-600">Quản lý các giao dịch chuyển khoản thủ công đang chờ admin xác nhận.</p>
        </div>
        <button
          type="button"
          onClick={loadDonations}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
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

      {successMessage && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p>}
      {errorMessage && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{errorMessage}</p>}
      {loading && <p className="mt-6 text-sm text-slate-600">Đang tải danh sách bill...</p>}

      <div className="mt-6 space-y-4">
        {!loading && donations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Không có giao dịch COD nào phù hợp bộ lọc hiện tại.
          </div>
        )}

        {donations.map((donation) => {
          const billImage = donation.billImage || '';
          const canApprove = donation.paymentMethod === 'cod' && donation.status === 'pending_review';

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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{formatCurrency(donation.amount)}</h2>
                      <p className="mt-1 text-sm text-slate-600">{donation.postSnapshot?.title || donation.post?.title || 'Bài viết'}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[donation.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                      {statusLabels[donation.status] || donation.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <p><strong>Người ủng hộ:</strong> {donation.donor?.fullName || donation.donorSnapshot?.fullName || 'N/A'} ({donation.donor?.email || 'N/A'})</p>
                    <p><strong>Tác giả nhận:</strong> {donation.author?.fullName || donation.authorSnapshot?.fullName || 'N/A'} ({donation.author?.email || 'N/A'})</p>
                    <p><strong>Phương thức:</strong> {donation.paymentMethod?.toUpperCase()}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(donation.createdAt).toLocaleString('vi-VN')}</p>
                    {donation.completedAt && <p><strong>Hoàn thành:</strong> {new Date(donation.completedAt).toLocaleString('vi-VN')}</p>}
                    {donation.approvedBy && <p><strong>Admin duyệt:</strong> {donation.approvedBy?.fullName || donation.approvedBy?.email || 'N/A'}</p>}
                  </div>

                  {donation.note && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <strong>Ghi chú:</strong> {donation.note}
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
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => handleApprove(donation._id)}
                        disabled={approvingId === donation._id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {approvingId === donation._id ? 'Đang duyệt...' : 'Duyệt bill'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
