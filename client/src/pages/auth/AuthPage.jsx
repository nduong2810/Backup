import { Outlet } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function AuthPage() {
  return (
      <AuthLayout>
        {/* Outlet là 'chiếc khung' để React Router tự động nhúng LoginPage hoặc RegisterPage vào */}
        <Outlet />
      </AuthLayout>
  );
}