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
      subtitle="Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu"
      icon="lock_reset"
      className="mx-auto max-w-xl"
      contentClassName="mx-auto max-w-md"
      rightSlot={
        <span className="hidden h-[52px] min-w-16 items-center justify-center rounded-2xl bg-slate-100 px-3 text-center text-xs font-bold leading-5 text-slate-600 sm:flex">
          Bước<br />1/3
        </span>
      }
    >
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
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

