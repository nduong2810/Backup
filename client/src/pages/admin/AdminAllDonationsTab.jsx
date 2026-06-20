import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAllDonations } from '../../services/userService';

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Tất cả phương thức' },
  { value: 'vnpay', label: 'VNPAY' },
  { value: 'cod', label: 'COD / Chuyển khoản' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending_review', label: 'Chờ duyệt bill' },
  { value: 'pending_payment', label: 'Chờ thanh toán VNPAY' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_LABELS = {
  pending_review: 'Chờ duyệt bill',
  pending_payment: 'Chờ thanh toán VNPAY',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
};

const STATUS_STYLES = {
  pending_review: 'border-amber-200 bg-amber-50 text-amber-700',
  pending_payment: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

const METHOD_LABELS = {
  cod: 'COD',
  vnpay: 'VNPAY',
};

const METHOD_STYLES = {
  cod: 'border-orange-200 bg-orange-50 text-orange-700',
  vnpay: 'border-sky-200 bg-sky-50 text-sky-700',
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const formatShortAmount = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
  return String(amount);
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

const getUserName = (donation, type) => {
  const doc = type === 'donor' ? donation.donor : donation.author;
  const snapshot = type === 'donor' ? donation.donorSnapshot : donation.authorSnapshot;
  return doc?.fullName || snapshot?.fullName || 'Không rõ';
};

const getUserEmail = (donation, type) => {
  const doc = type === 'donor' ? donation.donor : donation.author;
  return doc?.email || '—';
};

function MiniDonationChart({ timeline = [] }) {
  const maxValue = Math.max(...timeline.map((item) => Number(item.completedAmount || 0)), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Donation Flow</p>
          <h3 className="mt-1 text-lg font-extrabold leading-7 text-slate-900">Dòng tiền hoàn thành 6 tháng gần đây</h3>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">VND</span>
      </div>

      <div className="mt-5 flex h-44 items-end gap-3 rounded-2xl bg-slate-50 px-4 py-4">
        {timeline.map((item) => {
          const value = Number(item.completedAmount || 0);
          const height = Math.max(8, Math.round((value / maxValue) * 128));
          return (
            <div key={`${item.year}-${item.month}`} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-32 w-full items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-xl bg-primary/80 transition-all duration-300 group-hover:bg-primary"
                  style={{ height }}
                />
                <div className="absolute -top-8 hidden rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block">
                  {formatShortAmount(value)}
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAllDonationsTab({ embedded = false }) {
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [byPaymentMethod, setByPaymentMethod] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
    keyword: appliedKeyword,
    paymentMethod,
    status,
  }), [pagination.page, pagination.limit, appliedKeyword, paymentMethod, status]);

  const loadDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminAllDonations(query);
      const data = response?.data?.data || {};
      setDonations(Array.isArray(data.donations) ? data.donations : []);
      setSummary(data.summary || {});
      setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
      setByPaymentMethod(Array.isArray(data.byPaymentMethod) ? data.byPaymentMethod : []);
      setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }));
    } catch (loadError) {
      setDonations([]);
      setError(loadError?.response?.data?.message || 'Không thể tải danh sách giao dịch quyên góp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.keyword, query.paymentMethod, query.status]);

  const methodStats = useMemo(() => {
    const map = new Map(byPaymentMethod.map((item) => [item._id, item]));
    return {
      cod: map.get('cod') || { count: 0, amount: 0 },
      vnpay: map.get('vnpay') || { count: 0, amount: 0 },
    };
  }, [byPaymentMethod]);

  const handleSearch = (event) => {
    event?.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedKeyword(keyword.trim());
  };

  const handlePaymentMethodChange = (event) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setPaymentMethod(event.target.value);
  };

  const handleStatusChange = (event) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setStatus(event.target.value);
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), pagination.totalPages || 1);
    setPagination((prev) => ({ ...prev, page: safePage }));
  };

  return (
    <section className={embedded ? 'space-y-5' : 'mx-auto w-full max-w-[1400px] px-6 py-8'}>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">All Donations Management</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-9 text-slate-900 sm:text-3xl">Quản lý giao dịch quyên góp</h2>
          </div>

          <form onSubmit={handleSearch} className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr),220px,220px,104px]">
            <div className="relative min-w-0">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm người gửi/người nhận..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <select
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={handleStatusChange}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
              Lọc
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-h-[128px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng giao dịch</p>
          <h3 className="mt-2 text-3xl font-extrabold leading-none text-slate-900">{summary.donationCount || 0}</h3>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Theo bộ lọc hiện tại</p>
        </div>
        <div className="min-h-[128px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiền hoàn thành</p>
          <h3 className="mt-2 truncate text-xl font-extrabold leading-7 text-emerald-700" title={formatCurrency(summary.completedAmount)}>{formatCurrency(summary.completedAmount)}</h3>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{summary.completedCount || 0} giao dịch thành công</p>
        </div>
        <div className="min-h-[128px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">COD</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-none text-orange-700">{methodStats.cod.count || 0}</h3>
          <p className="mt-2 truncate text-xs font-semibold leading-5 text-slate-500" title={formatCurrency(methodStats.cod.amount)}>{formatCurrency(methodStats.cod.amount)}</p>
        </div>
        <div className="min-h-[128px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">VNPAY</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-none text-sky-700">{methodStats.vnpay.count || 0}</h3>
          <p className="mt-2 truncate text-xs font-semibold leading-5 text-slate-500" title={formatCurrency(methodStats.vnpay.amount)}>{formatCurrency(methodStats.vnpay.amount)}</p>
        </div>
      </div>

      <MiniDonationChart timeline={timeline} />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="w-[180px] px-5 py-4 align-middle">Mã giao dịch</th>
                <th className="w-[180px] px-5 py-4 align-middle">Người gửi</th>
                <th className="w-[180px] px-5 py-4 align-middle">Người nhận</th>
                <th className="w-[150px] px-5 py-4 text-right align-middle">Số tiền</th>
                <th className="w-[130px] px-5 py-4 text-center align-middle">Phương thức</th>
                <th className="w-[170px] px-5 py-4 text-center align-middle">Trạng thái</th>
                <th className="w-[170px] px-5 py-4 align-middle">Ngày tạo</th>
                <th className="px-5 py-4 align-middle">Bài viết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-5 py-5"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-36 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-36 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="ml-auto h-4 w-20 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="mx-auto h-7 w-20 rounded-full bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="mx-auto h-7 w-32 rounded-full bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-28 rounded bg-slate-100" /></td>
                  <td className="px-5 py-5"><div className="h-4 w-40 rounded bg-slate-100" /></td>
                </tr>
              ))}

              {!loading && donations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Không có giao dịch phù hợp.</p>
                    <p className="mt-1 text-xs text-slate-400">Thử đổi từ khóa, phương thức hoặc trạng thái.</p>
                  </td>
                </tr>
              )}

              {!loading && donations.map((donation) => (
                <tr key={donation._id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-5 align-top">
                    <div className="max-w-[160px] truncate text-sm font-bold leading-6 text-slate-800" title={donation.orderId || donation.requestId || donation._id}>{donation.orderId || donation.requestId || donation._id}</div>
                    <div className="mt-1 max-w-[160px] truncate text-xs leading-5 text-slate-400" title={donation._id}>{donation._id}</div>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <div className="max-w-[170px] truncate text-sm font-semibold leading-6 text-slate-800" title={getUserName(donation, 'donor')}>{getUserName(donation, 'donor')}</div>
                    <div className="max-w-[170px] truncate text-xs leading-5 text-slate-400" title={getUserEmail(donation, 'donor')}>{getUserEmail(donation, 'donor')}</div>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <div className="max-w-[170px] truncate text-sm font-semibold leading-6 text-slate-800" title={getUserName(donation, 'author')}>{getUserName(donation, 'author')}</div>
                    <div className="max-w-[170px] truncate text-xs leading-5 text-slate-400" title={getUserEmail(donation, 'author')}>{getUserEmail(donation, 'author')}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-5 text-right align-top text-sm font-extrabold leading-6 text-slate-900">{formatCurrency(donation.amount)}</td>
                  <td className="px-5 py-5 text-center align-top">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold leading-none ${METHOD_STYLES[donation.paymentMethod] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {METHOD_LABELS[donation.paymentMethod] || donation.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-center align-top">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold leading-none ${STATUS_STYLES[donation.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {STATUS_LABELS[donation.status] || donation.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-5 align-top text-sm font-semibold leading-6 text-slate-500">{formatDateTime(donation.createdAt)}</td>
                  <td className="px-5 py-5 align-top">
                    {donation.post?._id ? (
                      <Link to={`/posts/${donation.post._id}`} className="line-clamp-2 max-w-[300px] text-sm font-semibold leading-6 text-primary hover:underline">
                        {donation.post?.title || donation.postSnapshot?.title || 'Bài viết'}
                      </Link>
                    ) : (
                      <span className="line-clamp-2 max-w-[300px] text-sm leading-6 text-slate-500">{donation.postSnapshot?.title || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Tổng <span className="text-slate-900">{pagination.total || 0}</span> giao dịch
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
            <span className="text-sm font-bold text-slate-700">{pagination.page || 1} / {pagination.totalPages || 1}</span>
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
    </section>
  );
}
