import { Navigate, Route, Routes } from 'react-router-dom';
import ForumLayout from './components/layout/ForumLayout';
import PostDetailLayout from './components/layout/PostDetailLayout';
import AuthShellLayout from './components/layout/AuthShellLayout';
import ProfileShellLayout from './components/layout/ProfileShellLayout';
import MainContent from './components/layout/MainContent';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyResetOTP from './components/auth/VerifyResetOTP';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import ProfilePage from './pages/profile/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PostDetailPage from './pages/post/PostDetailPage';
import './App.css';

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_55%)] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 rounded-2xl border border-sky-100 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-900">IT Forum</h1>
          <p className="mt-1 text-sm text-slate-600">Không gian hỏi đáp và chia sẻ kiến thức công nghệ.</p>
        </header>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route element={<ForumLayout />}>
        <Route index element={<MainContent />} />
        <Route path="home" element={<MainContent />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthShellLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/verify-reset-otp" element={<VerifyResetOTP />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Route>
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
      <Route path="/verify-reset-otp" element={<Navigate to="/auth/verify-reset-otp" replace />} />
      <Route path="/reset-password" element={<Navigate to="/auth/reset-password" replace />} />

      {/* User / Admin */}
      <Route element={<ProfileShellLayout />}>
        <Route path="/user/profile" element={<ProfilePage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* Post Detail */}
      <Route element={<PostDetailLayout />}>
        <Route path="/posts/:id" element={<PostDetailPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
