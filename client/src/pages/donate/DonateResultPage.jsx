import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import FormAlert from '../../components/ui/FormAlert';
import { confirmVnpayDonationApi } from '../../services/donationService';

export default function DonateResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Đang xác nhận giao dịch...');
  const [error, setError] = useState('');
  const [donation, setDonation] = useState(null);

  useEffect(() => {
    let mounted = true;

    const confirmDonation = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const transactionId = sessionStorage.getItem('vnpayDonationTransactionId') || params.get('transactionId') || '';
        const txnRef = sessionStorage.getItem('vnpayDonationTxnRef') || params.get('vnp_TxnRef') || params.get('txnRef') || '';
        const responseCode = params.get('vnp_ResponseCode') || params.get('responseCode') || '';
        const vnpayMessage = params.get('vnp_OrderInfo') || params.get('message') || '';
        const amount = params.get('vnp_Amount') || params.get('amount') || '';

        if (!responseCode) {
          throw new Error('Thiếu tham số kết quả thanh toán từ VNPAY.');
        }

        const payload = {
          responseCode,
        };

        if (transactionId) payload.transactionId = transactionId;
        if (txnRef) payload.txnRef = txnRef;
        if (vnpayMessage) payload.message = vnpayMessage;
        if (amount) payload.amount = Number(amount);

        const response = await confirmVnpayDonationApi(payload);

        if (!mounted) return;
        setDonation(response?.data?.data || null);
        setMessage(String(responseCode) === '00' ? 'Thanh toán thành công.' : 'Thanh toán không thành công.');
        sessionStorage.removeItem('vnpayDonationTransactionId');
        sessionStorage.removeItem('vnpayDonationTxnRef');
      } catch (confirmError) {
        if (!mounted) return;
        setError(confirmError?.response?.data?.message || confirmError.message || 'Không thể xác nhận giao dịch.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    confirmDonation();
    return () => {
      mounted = false;
    };
  }, [location.search]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <AppCard title="Kết quả thanh toán" subtitle="Xác nhận giao dịch ủng hộ tác giả">
        <FormAlert type={error ? 'error' : 'success'} message={error || message} />

        {loading && <div className="mt-6 h-28 animate-pulse rounded-2xl bg-slate-100" />}

        {!loading && donation && (
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Tác giả nhận</div>
              <div className="mt-1 font-semibold text-slate-900">{donation.authorSnapshot?.fullName || donation.author?.fullName || 'Tác giả'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Số tiền</div>
              <div className="mt-1 text-2xl font-bold text-amber-700">{Number(donation.amount || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Trạng thái</div>
              <div className="mt-1 font-semibold text-slate-900">{donation.status}</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <AppButton onClick={() => navigate(donation?.author?._id ? `/users/${donation.author._id}` : '/home')}>
            Xem hồ sơ tác giả
          </AppButton>
          <AppButton variant="secondary" onClick={() => navigate('/home')}>
            Về trang chủ
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}