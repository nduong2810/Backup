import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import { requestOtpThunk, setField, setStep, verifyOtpThunk } from '../../store/slices/forgotPasswordSlice';

const OTP_TTL_SECONDS = 5 * 60;

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function VerifyOTP() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, otp, loading, successMessage, errorMessage } = useSelector((state) => state.forgotPassword);
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);

  useEffect(() => {
    setTimeLeft(OTP_TTL_SECONDS);
  }, [email]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  if (!email) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    if (timeLeft <= 0) return;
    const resultAction = await dispatch(verifyOtpThunk());
    if (verifyOtpThunk.fulfilled.match(resultAction)) {
      navigate('/auth/reset-password');
    }
  };

  const handleResendOtp = async () => {
    const resultAction = await dispatch(requestOtpThunk());
    if (requestOtpThunk.fulfilled.match(resultAction)) {
      dispatch(setField({ field: 'otp', value: '' }));
      setTimeLeft(OTP_TTL_SECONDS);
    }
  };

  return (
    <AppCard
      title="Xác thực OTP"
      subtitle={`Nhập mã 6 số đã gửi về ${email}`}
      icon="mark_email_read"
      className="mx-auto max-w-xl"
      contentClassName="mx-auto max-w-md"
      rightSlot={
        <span className="hidden h-[52px] min-w-16 items-center justify-center rounded-2xl bg-slate-100 px-3 text-center text-xs font-bold leading-5 text-slate-600 sm:flex">
          Bước<br />2/3
        </span>
      }
    >
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        <InputField
          label="Mã OTP"
          name="otp"
          value={otp}
          onChange={(event) => dispatch(setField({ field: 'otp', value: event.target.value }))}
          placeholder="Nhập mã 6 số"
          maxLength={6}
          required
          disabled={loading}
          inputClassName="text-center text-lg font-bold tracking-[0.35em]"
        />
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="leading-5">
            {timeLeft > 0
              ? `Mã OTP hết hạn sau ${formatTime(timeLeft)}.`
              : 'Mã OTP đã hết hạn. Vui lòng gửi lại.'}
          </span>
          {timeLeft <= 0 && (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="font-semibold text-sky-700 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang gửi lại...' : 'Gửi lại OTP'}
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex-1">
            <AppButton
              variant="secondary"
              onClick={() => {
                dispatch(setStep(1));
                navigate('/auth/forgot-password');
              }}
              disabled={loading}
              fullWidth
            >
              Quay lại
            </AppButton>
          </div>
          <div className="flex-1">
            <AppButton type="submit" fullWidth disabled={loading || timeLeft <= 0}>
              {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
            </AppButton>
          </div>
        </div>
      </form>
    </AppCard>
  );
}
