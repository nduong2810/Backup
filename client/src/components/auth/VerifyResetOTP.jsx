import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import { setField, setStep, verifyOtpThunk } from '../../store/slices/forgotPasswordSlice';

export default function VerifyOTP() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, otp, loading, successMessage, errorMessage } = useSelector((state) => state.forgotPassword);

  if (!email) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    const resultAction = await dispatch(verifyOtpThunk());
    if (verifyOtpThunk.fulfilled.match(resultAction)) {
      navigate('/auth/reset-password');
    }
  };

  return (
    <AppCard
      title="Xác thực OTP"
      subtitle="Bước 2/3: Nhập mã OTP đã gửi về email"
      rightSlot={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Bước 2/3</span>}
    >
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <InputField
          label="Mã OTP"
          name="otp"
          value={otp}
          onChange={(event) => dispatch(setField({ field: 'otp', value: event.target.value }))}
          placeholder="Nhập mã 6 số"
          required
          disabled={loading}
        />
        <div className="flex gap-3">
          <AppButton
            variant="secondary"
            onClick={() => {
              dispatch(setStep(1));
              navigate('/auth/forgot-password');
            }}
            disabled={loading}
          >
            Quay lại
          </AppButton>
          <AppButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
}
