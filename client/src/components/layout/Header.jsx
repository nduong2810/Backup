import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/loginSlice';
import SearchBar from '../common/SearchBar';
import CreatePostModal from '../post/CreatePostModal';
import NotificationBell from '../notification/NotificationBell';

const Header = ({ searchValue = '', onSearchChange, onSearch }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.login);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const menuRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const handleCreatePostClick = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    setCreateModalOpen(true);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-surface-container-lowest dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
      <div className="flex lg:grid lg:grid-cols-[1fr,auto,1fr] items-center justify-between h-16 w-full px-4 lg:px-6 max-w-none mx-auto gap-4">
        <div className="flex items-center">
          <Link className="flex items-center gap-2 font-headline-lg text-headline-lg font-bold text-on-surface dark:text-inverse-on-surface" to="/home">
            <span className="material-symbols-outlined text-primary text-[32px]">code</span>
            <span>ITForum</span>
          </Link>
        </div>

        <div className="hidden lg:flex w-[660px] xl:w-[720px] items-center gap-4 justify-center">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch}
            className="w-full"
            showButton={false}
            inputClassName="bg-surface-container-lowest border-outline-variant rounded-DEFAULT pl-10 pr-4 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 text-on-surface placeholder:text-outline shadow-none"
          />
          <button
            onClick={handleCreatePostClick}
            className="bg-primary hover:bg-primary/90 text-white font-body-md text-body-md font-semibold px-5 py-2.5 rounded-DEFAULT transition-colors shrink-0"
          >
            Tạo bài viết
          </button>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={handleCreatePostClick}
            className="bg-primary hover:bg-primary/90 text-white font-body-sm text-body-sm font-semibold px-4 py-2 rounded-DEFAULT transition-colors shrink-0 lg:hidden"
          >
            Tạo bài viết
          </button>

          {user && <NotificationBell />}

          {user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2 py-1 min-w-0 rounded-DEFAULT hover:bg-surface-container-low transition-colors"
              >
                <img
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                  src={user.avatar && user.avatar !== 'default-avatar.png'
                    ? user.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=0066cc&color=fff&size=32`}
                />
                <span className="font-body-sm text-body-sm font-semibold max-w-[160px] truncate">
                  Xin chào, {user.fullName || user.username}
                </span>
                <span className="material-symbols-outlined text-[18px] text-secondary">expand_more</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-md overflow-hidden z-50">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/admin/profile');
                        }}
                        className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/admin/dashboard');
                        }}
                        className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Trang quản trị
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/admin/posts');
                        }}
                        className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Quản lý bài đăng
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/user/profile');
                        }}
                        className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/user/saves');
                        }}
                        className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Thư mục lưu trữ
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-error hover:bg-error-container/40 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/auth/login')}
                className="bg-primary hover:bg-primary/90 text-white font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                className="bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
      <CreatePostModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </header>
  );
};

export default Header;
