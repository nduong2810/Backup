import { Link } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';

export default function LoginFormUI({ form, loading, errorMessage, successMessage, onFieldChange, onSubmit }) {
  const alertType = errorMessage ? 'error' : successMessage ? 'success' : '';
  const alertMessage = errorMessage || successMessage || '';

  return (
    <AppCard title="Đăng nhập" subtitle="Chào mừng bạn quay trở lại IT Forum">
      <FormAlert type={alertType} message={alertMessage} />

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          placeholder="youremail@example.com"
          required
          disabled={loading}
        />

        <InputField
          label="Mật khẩu"
          name="password"
          type="password"
          value={form.password}
          onChange={(event) => onFieldChange('password', event.target.value)}
          placeholder="Nhập mật khẩu"
          allowPasswordToggle
          required
          disabled={loading}
        />

        <div className="flex items-center justify-end">
          <Link to="/auth/forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            Quên mật khẩu?
          </Link>
        </div>

        <AppButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </AppButton>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to="/auth/register" className="font-semibold text-sky-700 hover:text-sky-800">
          Đăng ký ngay
        </Link>
      </p>
    </AppCard>
  );
}
