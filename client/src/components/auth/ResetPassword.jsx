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
    <AppCard title="Đặt lại mật khẩu" subtitle="Bước 3/3: Tạo mật khẩu mới">
      <FormAlert type={alertType} message={alertMessage} />

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <InputField
          label="Mật khẩu mới"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => dispatch(setField({ field: 'newPassword', value: event.target.value }))}
          placeholder="Tối thiểu 6 ký tự, có số"
          required
          disabled={loading}
        />
        <InputField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => dispatch(setField({ field: 'confirmPassword', value: event.target.value }))}
          required
          disabled={loading}
        />

        <AppButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </AppButton>
      </form>
    </AppCard>
  );
}

