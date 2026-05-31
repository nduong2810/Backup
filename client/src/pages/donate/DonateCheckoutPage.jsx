import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import FormAlert from '../../components/ui/FormAlert';
import { createDonationCheckoutApi } from '../../services/donationService';

const AMOUNTS = [
  { value: 20000, label: '20K', caption: 'Một ly cafe nhỏ' },
  { value: 50000, label: '50K', caption: 'Một lời cảm ơn rõ ràng' },
  { value: 100000, label: '100K', caption: 'Ủng hộ mạnh tay' },
];

const METHODS = [
  { value: 'vnpay', label: 'Ví điện tử VNPAY Sandbox' },
  { value: 'cod', label: 'Chuyển khoản ngân hàng / COD' },
];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id;
    if (value._id && typeof value._id.toString === 'function') return value._id.toString();
    if (typeof value.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue && stringValue !== '[object Object]') return stringValue;
    }
  }
  return '';
};

const isMongoId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

const pickValidId = (...values) => {
  for (const value of values) {
    const normalized = normalizeId(value);
    if (isMongoId(normalized)) return normalized;
  }
  return '';
};

export default function DonateCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionContext = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('donationCheckoutContext') || 'null') || {};
    } catch {
      return {};
    }
  })();
  const queryParams = new URLSearchParams(location.search);

  const getIdValue = (...values) => pickValidId(...values);
  const getTextValue = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || '';

  const [amount, setAmount] = useState(20000);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [note, setNote] = useState('');
  const [billImage, setBillImage] = useState('');
  const [billImageName, setBillImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const postId = getIdValue(location.state?.postId, sessionContext.postId, queryParams.get('postId'));
  const answerIdValue = getIdValue(location.state?.answerId, sessionContext.answerId, queryParams.get('answerId'));
  const authorId = answerIdValue
    ? getIdValue(location.state?.authorId, sessionContext.authorId, queryParams.get('authorId'))
    : getIdValue(
        location.state?.postAuthorId,
        sessionContext.postAuthorId,
        queryParams.get('postAuthorId'),
        location.state?.authorId,
        sessionContext.authorId,
        queryParams.get('authorId'),
      );
  const authorName = getTextValue(location.state?.authorName, sessionContext.authorName, queryParams.get('authorName'))
    || getTextValue(location.state?.postAuthorName, sessionContext.postAuthorName, queryParams.get('postAuthorName'))
    || 'tác giả';
  const answerId = answerIdValue;
  const answerContent = getTextValue(location.state?.answerContent, sessionContext.answerContent, queryParams.get('answerContent'));
  const postTitle = getTextValue(location.state?.postTitle, sessionContext.postTitle, queryParams.get('postTitle')) || 'Bài viết';
  const checkoutError = !postId
      ? 'Thiếu dữ liệu bài viết. Hãy quay lại trang chi tiết để bắt đầu ủng hộ.'
      : '';
  const selectedAmount = useMemo(() => AMOUNTS.find((item) => item.value === amount) || AMOUNTS[0], [amount]);

  const handleBillChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setBillImage('');
      setBillImageName('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBillImage(String(reader.result || ''));
      setBillImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (checkoutError) {
      setMessage('Không thể tạo checkout vì thiếu dữ liệu bài viết.');
      return;
    }

    if (paymentMethod === 'cod' && !billImage) {
      setMessage('Bạn cần tải ảnh bill chuyển khoản lên trước khi tạo giao dịch.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        postId,
        amount,
        paymentMethod,
        note,
        billImage: paymentMethod === 'cod' ? billImage : '',
      };

      if (authorId) {
        payload.authorId = authorId;
      }

      if (answerId) {
        payload.answerId = answerId;
      }

      const response = await createDonationCheckoutApi(payload);

      const donation = response?.data?.data?.donation;
      const paymentUrl = response?.data?.data?.paymentUrl;

      if (paymentUrl) {
        if (donation?._id) {
          sessionStorage.setItem('vnpayDonationTransactionId', donation._id);
        }
        if (donation?.orderId) {
          sessionStorage.setItem('vnpayDonationTxnRef', donation.orderId);
        }
        window.location.assign(paymentUrl);
        return;
      }

      setMessage(response?.data?.message || 'Giao dịch đã được tạo thành công.');
    } catch (submitError) {
      const validationErrors = submitError?.response?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        setMessage(validationErrors.map((item) => item.msg).join(' | '));
        return;
      }

      setMessage(submitError?.response?.data?.message || 'Không thể tạo giao dịch ủng hộ.');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutError) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <AppCard title="Thanh toán ủng hộ" subtitle="Màn hình checkout cho tác giả">
          <FormAlert type="error" message={checkoutError} />
          <div className="mt-5 flex gap-3">
            <AppButton onClick={() => navigate(-1)}>Quay lại</AppButton>
            <AppButton variant="secondary" onClick={() => navigate('/home')}>Về trang chủ</AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Quay lại
        </button>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          Checkout
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AppCard title="Ủng hộ tác giả" subtitle={`Thanh toán tách cafe cho câu trả lời của ${authorName}`}>
          <FormAlert type={message ? 'error' : 'info'} message={message || ''} />

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">1. Chọn mức tiền</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {AMOUNTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAmount(item.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${amount === item.value ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="text-lg font-bold text-slate-900">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.caption}</div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Chọn phương thức</h3>
              <div className="space-y-3">
                {METHODS.map((item) => (
                  <label
                    key={item.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${paymentMethod === item.value ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={item.value}
                      checked={paymentMethod === item.value}
                      onChange={() => setPaymentMethod(item.value)}
                      className="mt-1 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{item.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">3. Ghi chú và bill</h3>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Lời nhắn cho tác giả</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Ví dụ: Câu trả lời rất rõ ràng, cảm ơn bạn!"
                />
              </label>

              {paymentMethod === 'cod' && (
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Ảnh bill chuyển khoản</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBillChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  {billImageName && <p className="mt-2 text-xs text-slate-500">Đã chọn: {billImageName}</p>}
                </label>
              )}
            </section>

            <AppButton type="submit" disabled={loading} fullWidth>
              {loading ? 'Đang xử lý...' : paymentMethod === 'cod' ? 'Gửi giao dịch' : `Thanh toán ${selectedAmount.label} bằng VNPAY`}
            </AppButton>
          </form>
        </AppCard>

        <div className="space-y-6">
          <AppCard title="Tóm tắt checkout" subtitle="Xem nhanh thông tin giao dịch">
            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Bài viết</div>
                <div className="mt-1 font-semibold text-slate-900">{postTitle}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Câu trả lời được ủng hộ</div>
                <p className="mt-1 line-clamp-6 text-slate-700">{answerContent || 'Donate trực tiếp cho tác giả của câu trả lời.'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Số tiền</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">{amount.toLocaleString('vi-VN')}đ</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Tác giả nhận</div>
                <div className="mt-1 font-semibold text-slate-900">{authorName}</div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
}