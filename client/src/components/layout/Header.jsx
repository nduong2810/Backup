import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/loginSlice';
import SearchBar from '../common/SearchBar';

const Header = ({ searchValue = '', onSearchChange, onSearch }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.login);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
      <div className="grid grid-cols-[auto,1fr,auto] items-center h-16 w-full px-4 lg:px-6 max-w-none mx-auto gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 lg:w-56">
            <Link className="flex items-center gap-2 font-headline-lg text-headline-lg font-bold text-on-surface dark:text-inverse-on-surface" to="/home">
              <span className="material-symbols-outlined text-primary text-[32px]">code</span>
              <span>ITForum</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-4">
            <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">About</a>
            <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">Products</a>
            <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">For Teams</a>
          </nav>
        </div>

        <div className="hidden lg:flex w-full justify-center">
          <div className="w-full max-w-xl">
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              onSearch={onSearch}
              className="w-full"
              showButton={false}
              inputClassName="bg-surface-container-lowest border-outline-variant rounded-DEFAULT pl-10 pr-4 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 text-on-surface placeholder:text-outline shadow-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 justify-end min-w-[220px] lg:min-w-[320px] lg:max-w-[320px]">
          <button className="bg-primary-container hover:bg-primary-container/90 text-on-primary font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors">
            Ask Question
          </button>

          {user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2 py-1 min-w-0 rounded-DEFAULT hover:bg-surface-container-low transition-colors"
              >
                <img
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                  src={user.avatar || 'https://i.pravatar.cc/150'}
                />
                <span className="font-body-sm text-body-sm font-semibold max-w-[160px] truncate">
                  Hi, {user.fullName || user.username}
                </span>
                <span className="material-symbols-outlined text-[18px] text-secondary">expand_more</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-md overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/user/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
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
                Log in
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                className="bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
