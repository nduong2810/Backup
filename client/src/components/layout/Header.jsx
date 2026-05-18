import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/loginSlice'; // Đảm bảo đường dẫn này trỏ đúng tới loginSlice của bạn
import SearchBar from '../common/SearchBar';

const Header = ({ searchValue = '', onSearchChange, onSearch }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy thông tin user từ Redux Store
    const { user } = useSelector((state) => state.login);

    // Hàm xử lý khi bấm nút Logout
    const handleLogout = () => {
        dispatch(logout()); // Dọn dẹp Redux và LocalStorage
        navigate('/auth/login'); // Đẩy người dùng về trang Đăng nhập
    };

    return (
        <header className="bg-surface-container-lowest dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
            <div className="flex items-center h-16 w-full px-4 lg:px-6 max-w-none mx-auto">
                {/* Logo & Navigation */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 lg:w-56">
                        <a className="flex items-center gap-2 font-headline-lg text-headline-lg font-bold text-on-surface dark:text-inverse-on-surface" href="#">
                            <span className="material-symbols-outlined text-primary text-[32px]">code</span>
                            <span>ITForum</span>
                        </a>
                    </div>
                    <nav className="hidden md:flex gap-3">
                        <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">About</a>
                        <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">Products</a>
                        <a className="text-secondary dark:text-secondary-fixed-dim font-body-md text-body-md hover:text-primary hover:bg-surface-container-low transition-colors duration-200 px-2 py-1 rounded" href="#">For Teams</a>
                    </nav>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl px-4 hidden lg:block">
                    <SearchBar
                        value={searchValue}
                        onChange={onSearchChange}
                        onSearch={onSearch}
                        className="max-w-xl"
                        showButton={false}
                        inputClassName="bg-surface-container-lowest border-outline-variant rounded-DEFAULT pl-10 pr-4 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 text-on-surface placeholder:text-outline shadow-none"
                    />
                </div>

                {/* Action Buttons & User Profile */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="bg-primary-container hover:bg-primary-container/90 text-on-primary font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors">Ask Question</button>

                    {/* Kiểm tra: Nếu đã đăng nhập (có user) thì hiện Profile & Logout, chưa thì hiện Login */}
                    {user ? (
                        <div className="hidden md:flex items-center gap-3">
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate('/profile')} // Click vào tên/avatar để vào trang cá nhân
                            >
                                <img
                                    alt="User Avatar"
                                    className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                                    src={user.avatar || "https://i.pravatar.cc/150"}
                                />
                                <span className="font-body-sm text-body-sm font-semibold">
                                    {/* Ưu tiên hiện Full Name, nếu không có thì hiện Username */}
                                    Hi, {user.fullName || user.username}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-secondary hover:text-red-500 font-label-mono text-label-mono px-3 py-1.5 border border-outline-variant rounded-DEFAULT hover:bg-surface-container-low transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/auth/login')}
                            className="bg-primary hover:bg-primary/90 text-white font-label-mono text-label-mono px-4 py-2 rounded-DEFAULT transition-colors"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;