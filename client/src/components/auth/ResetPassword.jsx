import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import { resetPasswordThunk, setField } from '../../store/slices/forgotPasswordSlice';

export default function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    email,
    resetToken,
    newPassword,
    confirmPassword,
    loading,
    successMessage,
    errorMessage,
  } = useSelector((state) => state.forgotPassword);

  if (!email || !resetToken) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || '';

  const onSubmit = async (event) => {
    event.preventDefault();
    const resultAction = await dispatch(resetPasswordThunk());

    if (resetPasswordThunk.fulfilled.match(resultAction)) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AppCard
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu mới an toàn để hoàn tất khôi phục tài khoản"
      icon="password"
      className="mx-auto max-w-xl"
      contentClassName="mx-auto max-w-md"
      rightSlot={
        <span className="hidden h-[52px] min-w-16 items-center justify-center rounded-2xl bg-slate-100 px-3 text-center text-xs font-bold leading-5 text-slate-600 sm:flex">
          Bước<br />3/3
        </span>
      }
    >
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        <InputField
          label="Mật khẩu mới"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => dispatch(setField({ field: 'newPassword', value: event.target.value }))}
          placeholder="Tối thiểu 6 ký tự, có số"
          required
          disabled={loading}
          allowPasswordToggle
        />
        <InputField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => dispatch(setField({ field: 'confirmPassword', value: event.target.value }))}
          placeholder="Nhập lại mật khẩu mới"
          required
          disabled={loading}
          allowPasswordToggle
        />

        <AppButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </AppButton>
      </form>
    </AppCard>
  );
}

