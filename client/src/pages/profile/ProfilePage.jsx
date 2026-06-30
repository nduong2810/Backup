import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Profile from '../../components/user/Profile';

export default function ProfilePage() {
  const { user } = useSelector((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/profile', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
      </div>
    );
  }

  return <Profile />;
}

