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
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import AuthorProfilePage from './pages/profile/AuthorProfilePage';
import SavedPostsPage from './pages/profile/SavedPostsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PostDetailPage from './pages/post/PostDetailPage';
import DonateCheckoutPage from './pages/donate/DonateCheckoutPage';
import DonateResultPage from './pages/donate/DonateResultPage';
import TagsPage from './pages/tags/TagsPage';
import ReportHistoryPage from './pages/report/ReportHistoryPage';
import TrashPage from './pages/trash/TrashPage';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Home + Admin (shared ForumLayout) */}
      <Route element={<ForumLayout />}>
        <Route index element={<MainContent />} />
        <Route path="home" element={<MainContent />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="reports/history" element={<ReportHistoryPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="donate/checkout" element={<DonateCheckoutPage />} />
        <Route path="donate/result" element={<DonateResultPage />} />
        {/* Admin pages inside ForumLayout */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/posts" element={<Navigate to="/admin/dashboard?tab=posts" replace />} />
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

      {/* User / Admin Profile */}
      <Route element={<ProfileShellLayout />}>
        <Route path="/user/profile" element={<ProfilePage />} />
        <Route path="/user/saves" element={<SavedPostsPage />} />
        <Route path="/users/:id" element={<AuthorProfilePage />} />
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
