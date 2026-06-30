import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import FormAlert from '../../components/ui/FormAlert';
import { createDonationCheckoutApi, getPublicAuthorProfileApi } from '../../services/donationService';

import { useSelector } from 'react-redux';

const AMOUNTS = [
  { value: 20000, label: '20K', caption: 'Một ly cafe nhỏ' },
  { value: 50000, label: '50K', caption: 'Một lời cảm ơn rõ ràng' },
  { value: 100000, label: '100K', caption: 'Ủng hộ mạnh tay' },
];

const METHODS = [
  { value: 'vnpay', label: 'Ví điện tử VNPAY Sandbox', description: 'Thanh toán online và hệ thống tự xác nhận kết quả.' },
  { value: 'cod', label: 'Chuyển khoản ngân hàng thủ công', description: 'Chuyển khoản ngoài hệ thống, tải ảnh bill để admin đối soát rồi duyệt.' },
];

const normalizeId = (value, seen = new WeakSet()) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (seen.has(value)) return '';
    seen.add(value);
    if (typeof value.toHexString === 'function') return value.toHexString();
    if (value.$oid) return normalizeId(value.$oid, seen);
    if (value._id && value._id !== value) return normalizeId(value._id, seen);
    if (typeof value.id === 'string') return value.id.trim();
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

const getTextValue = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || '';

const normalizeAuthorName = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const lowered = text.toLowerCase();
  if (lowered === 'tác giả' || lowered === 'tac gia' || lowered === 'author') return '';
  return text;
};

const getRequestErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item) => item.msg).join(' | ');
  }

  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (!error?.response) {
    return 'Không kết nối được server. Hãy kiểm tra server localhost:5000 đang chạy rồi thử lại.';
  }

  return 'Không thể tạo giao dịch ủng hộ.';
};

export default function DonateCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.login);
  const sessionContext = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('donationCheckoutContext') || 'null') || {};
    } catch {
      return {};
    }
  })();
  const queryParams = new URLSearchParams(location.search);

  const [amount, setAmount] = useState(20000);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [note, setNote] = useState('');
  const [billImage, setBillImage] = useState('');
  const [billImageName, setBillImageName] = useState('');
  const [billImageLoading, setBillImageLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [createdManualDonation, setCreatedManualDonation] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState('');

  const postId = pickValidId(location.state?.postId, sessionContext.postId, queryParams.get('postId'));
  const answerIdValue = pickValidId(location.state?.answerId, sessionContext.answerId, queryParams.get('answerId'));
  const authorId = pickValidId(
    location.state?.recipientId,
    sessionContext.recipientId,
    queryParams.get('recipientId'),
    location.state?.authorId,
    sessionContext.authorId,
    queryParams.get('authorId'),
    location.state?.postAuthorId,
    sessionContext.postAuthorId,
    queryParams.get('postAuthorId'),
  );
  const rawAuthorName = getTextValue(location.state?.recipientName, sessionContext.recipientName, queryParams.get('recipientName'))
    || getTextValue(location.state?.authorName, sessionContext.authorName, queryParams.get('authorName'))
    || getTextValue(location.state?.postAuthorName, sessionContext.postAuthorName, queryParams.get('postAuthorName'));
  const authorName = normalizeAuthorName(rawAuthorName) || recipient?.fullName || 'Ẩn danh';
  const answerId = answerIdValue;
  const answerContent = getTextValue(location.state?.answerContent, sessionContext.answerContent, queryParams.get('answerContent'));
  const postTitle = getTextValue(location.state?.postTitle, sessionContext.postTitle, queryParams.get('postTitle')) || 'Bài viết';
  const isSelfDonation = authorId && user?._id && String(authorId) === String(user._id);
  const checkoutError = !postId
    ? 'Thiếu dữ liệu bài viết. Hãy quay lại trang chi tiết để bắt đầu ủng hộ.'
    : isSelfDonation
      ? 'Bạn không thể tự ủng hộ chính bản thân mình.'
      : '';
  const selectedAmount = useMemo(() => AMOUNTS.find((item) => item.value === amount) || AMOUNTS[0], [amount]);
  const hasTransferInfo = Boolean(recipient?.bankName && recipient?.bankAccountNumber);
  const isManualTransfer = paymentMethod === 'cod';
  const isManualTransferBlocked = isManualTransfer && !recipientLoading && !hasTransferInfo;
  const canFillManualProof = !isManualTransfer || hasTransferInfo;
  const submitDisabled = loading
    || recipientLoading
    || billImageLoading
    || (isManualTransfer && (!hasTransferInfo || !billImage || Boolean(fileError)));

  useEffect(() => {
    if (!authorId) return undefined;
    let mounted = true;
    setRecipientLoading(true);
    setRecipientError('');

    getPublicAuthorProfileApi(authorId, { page: 1, limit: 1 })
      .then((response) => {
        if (mounted) setRecipient(response?.data?.data?.user || null);
      })
      .catch(() => {
        if (!mounted) return;
        setRecipient(null);
        setRecipientError('Không tải được thông tin người nhận. Hãy kiểm tra server rồi tải lại trang.');
      })
      .finally(() => {
        if (mounted) setRecipientLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [authorId]);

  useEffect(() => {
    if (!isManualTransfer) {
      setFileError('');
      setBillImageLoading(false);
    }
  }, [isManualTransfer]);

  const handleBillChange = (event) => {
    const file = event.target.files?.[0];
    setFileError('');
    setBillImage('');
    setBillImageName('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('File bill phải là ảnh. Vui lòng chọn ảnh PNG, JPG, JPEG hoặc WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFileError('Ảnh bill tối đa 8MB. Vui lòng chọn ảnh nhỏ hơn.');
      event.target.value = '';
      return;
    }

    setBillImageLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setBillImage(String(reader.result || ''));
      setBillImageName(file.name);
      setBillImageLoading(false);
    };
    reader.onerror = () => {
      setFileError('Không đọc được ảnh bill. Vui lòng chọn lại ảnh khác.');
      setBillImageLoading(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setMessage('');
    setAlertType('info');
    setCreatedManualDonation(null);

    if (checkoutError) {
      setAlertType('error');
      setMessage('Không thể tạo checkout vì thiếu dữ liệu bài viết.');
      return;
    }

    if (isManualTransfer && recipientLoading) {
      setAlertType('error');
      setMessage('Đang tải thông tin người nhận. Vui lòng chờ vài giây rồi gửi lại.');
      return;
    }

    if (isManualTransfer && !hasTransferInfo) {
      setAlertType('error');
      setMessage(recipientError || 'Tác giả chưa cập nhật thông tin nhận chuyển khoản nên chưa thể dùng phương thức này.');
      return;
    }

    if (isManualTransfer && billImageLoading) {
      setAlertType('error');
      setMessage('Ảnh bill đang được xử lý. Vui lòng chờ ảnh tải xong rồi gửi lại.');
      return;
    }

    if (isManualTransfer && fileError) {
      setAlertType('error');
      setMessage(fileError);
      return;
    }

    if (isManualTransfer && !billImage) {
      setAlertType('error');
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
        billImage: isManualTransfer ? billImage : '',
      };
      if (authorId) payload.authorId = authorId;
      if (answerId) payload.answerId = answerId;

      const response = await createDonationCheckoutApi(payload);
      const donation = response?.data?.data?.donation;
      const paymentUrl = response?.data?.data?.paymentUrl;

      if (paymentUrl) {
        if (donation?._id) sessionStorage.setItem('vnpayDonationTransactionId', donation._id);
        if (donation?.orderId) sessionStorage.setItem('vnpayDonationTxnRef', donation.orderId);
        window.location.assign(paymentUrl);
        return;
      }

      setCreatedManualDonation(donation || null);
      setAlertType('success');
      setMessage(response?.data?.message || 'Đã gửi giao dịch chuyển khoản. Vui lòng chờ admin duyệt bill.');
      setBillImage('');
      setBillImageName('');
      setFileError('');
    } catch (submitError) {
      setAlertType('error');
      setMessage(getRequestErrorMessage(submitError));
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
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-slate-600 hover:text-slate-900">← Quay lại</button>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Checkout</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AppCard title="Ủng hộ tác giả" subtitle={`Thanh toán tách cafe cho câu trả lời của ${authorName}`}>
          <FormAlert type={alertType} message={message || ''} />

          {createdManualDonation && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">Đã gửi giao dịch chuyển khoản thành công.</p>
              <p className="mt-1 leading-6">Giao dịch đang chờ admin duyệt bill. Khi admin duyệt, hệ thống mới cộng điểm uy tín cho tác giả.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AppButton type="button" onClick={() => navigate('/home')}>Về trang chủ</AppButton>
                <AppButton type="button" variant="secondary" onClick={() => navigate(-1)}>Quay lại bài viết</AppButton>
              </div>
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">1. Chọn mức tiền</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {AMOUNTS.map((item) => (
                  <button key={item.value} type="button" onClick={() => setAmount(item.value)} className={`rounded-2xl border px-4 py-4 text-left transition ${amount === item.value ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
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
                  <label key={item.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${paymentMethod === item.value ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input type="radio" name="paymentMethod" value={item.value} checked={paymentMethod === item.value} onChange={() => setPaymentMethod(item.value)} className="mt-1 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500" />
                    <div>
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {isManualTransfer && (
              <section className={`rounded-2xl border p-4 ${hasTransferInfo ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}`}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  Thông tin nhận chuyển khoản
                </h3>
                {recipientLoading ? (
                  <p className="text-sm text-slate-500">Đang tải thông tin...</p>
                ) : hasTransferInfo ? (
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-sky-100"><p className="text-xs font-bold uppercase text-slate-400">Ngân hàng</p><p className="mt-1 font-bold text-slate-900">{recipient.bankName}</p></div>
                    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-sky-100"><p className="text-xs font-bold uppercase text-slate-400">STK</p><p className="mt-1 font-mono text-lg font-black text-slate-900">{recipient.bankAccountNumber}</p></div>
                    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-sky-100 sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Tên người nhận</p><p className="mt-1 font-bold text-slate-900">{recipient.fullName || authorName}</p></div>
                    <p className="sm:col-span-2 text-xs leading-5 text-slate-600">Sau khi chuyển đúng <strong>{amount.toLocaleString('vi-VN')}đ</strong>, hãy tải ảnh giao dịch thành công.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm leading-6 text-amber-800">
                    <p className="font-semibold">Tác giả chưa cập nhật thông tin nhận chuyển khoản.</p>
                    <p>{recipientError || 'Bạn chưa thể nhập ghi chú, tải bill hoặc gửi giao dịch chuyển khoản thủ công cho tác giả này. Hãy chọn VNPAY hoặc quay lại sau khi tác giả cập nhật ngân hàng/STK.'}</p>
                  </div>
                )}
              </section>
            )}

            {isManualTransferBlocked && (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                Các bước gửi minh chứng chuyển khoản đã được khóa vì chưa có thông tin tài khoản nhận tiền.
              </div>
            )}

            {canFillManualProof && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{isManualTransfer ? '3. Ghi chú và minh chứng chuyển khoản' : '3. Ghi chú'}</h3>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Lời nhắn cho tác giả</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={500} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="Ví dụ: Câu trả lời rất rõ ràng, cảm ơn bạn!" />
                </label>

                {isManualTransfer && (
                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Ảnh bill chuyển khoản</span>
                    <p className="mb-2 text-xs leading-5 text-slate-500">Ảnh bill dùng để admin đối soát giao dịch chuyển khoản thủ công.</p>
                    <input type="file" accept="image/*" onChange={handleBillChange} disabled={loading || billImageLoading} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70" />
                    {billImageLoading && <p className="mt-2 text-xs text-slate-500">Đang đọc ảnh bill...</p>}
                    {billImageName && !billImageLoading && <p className="mt-2 text-xs text-slate-500">Đã chọn: {billImageName}</p>}
                    {fileError && <p className="mt-2 text-xs font-semibold text-rose-600">{fileError}</p>}
                  </label>
                )}
              </section>
            )}

            <AppButton type="submit" disabled={submitDisabled} fullWidth>
              {loading ? 'Đang xử lý...' : isManualTransfer ? (hasTransferInfo ? 'Gửi bill chờ admin duyệt' : 'Chưa thể gửi chuyển khoản thủ công') : `Thanh toán ${selectedAmount.label} bằng VNPAY`}
            </AppButton>
          </form>
        </AppCard>

        <div className="space-y-6">
          <AppCard title="Tóm tắt checkout" subtitle="Xem nhanh thông tin giao dịch">
            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Bài viết</div><div className="mt-1 font-semibold text-slate-900">{postTitle}</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Câu trả lời được ủng hộ</div><p className="mt-1 line-clamp-6 text-slate-700">{answerContent || 'Donate trực tiếp cho tác giả của câu trả lời.'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Số tiền</div><div className="mt-1 text-2xl font-bold text-amber-700">{amount.toLocaleString('vi-VN')}đ</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Tác giả nhận</div><div className="mt-1 font-semibold text-slate-900">{recipient?.fullName || authorName}</div></div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
