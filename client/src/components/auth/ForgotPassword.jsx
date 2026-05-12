import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import { requestOtpThunk, setField } from '../../store/slices/forgotPasswordSlice';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, loading, successMessage, errorMessage } = useSelector((state) => state.forgotPassword);

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    const resultAction = await dispatch(requestOtpThunk());
    if (requestOtpThunk.fulfilled.match(resultAction)) {
      navigate('/auth/verify-reset-otp');
    }
  };

  return (
    <AppCard
      title="Quên mật khẩu"
      subtitle="Bước 1/3: Nhập email để nhận OTP"
      rightSlot={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Bước 1/3</span>}
    >
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => dispatch(setField({ field: 'email', value: event.target.value }))}
          placeholder="youremail@example.com"
          required
          disabled={loading}
        />
        <AppButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
        </AppButton>
      </form>
    </AppCard>
  );
}

