import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  markNotificationReadThunk,
  pushRealtimeNotification,
  setUnreadCount,
} from '../../store/slices/notificationSlice';
import { connectSocket, disconnectSocket } from '../../lib/socketClient';

const timeAgo = (dateString) => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user } = useSelector((state) => state.login);
  const { items, unreadCount, loading } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!accessToken || !user) return undefined;

    dispatch(fetchNotificationsThunk());
    const socket = connectSocket(accessToken);

    const handleNewNotification = (payload) => {
      dispatch(pushRealtimeNotification(payload));
      if (payload?.notification) {
        setToast(payload.notification);
        window.clearTimeout(window.__notificationToastTimer);
        window.__notificationToastTimer = window.setTimeout(() => setToast(null), 4500);
      }
    };

    const handleUnreadCount = (payload) => {
      dispatch(setUnreadCount(payload));
    };

    socket?.on('notification:new', handleNewNotification);
    socket?.on('notification:unread-count', handleUnreadCount);

    return () => {
      socket?.off('notification:new', handleNewNotification);
      socket?.off('notification:unread-count', handleUnreadCount);
      disconnectSocket();
    };
  }, [accessToken, user, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const openNotification = async (notification) => {
    if (!notification) return;
    if (!notification.isRead) {
      await dispatch(markNotificationReadThunk(notification._id));
    }
    setOpen(false);
    navigate(notification.link || `/posts/${notification.post?._id || notification.post}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-secondary hover:bg-surface-container-low hover:text-primary transition-colors"
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg z-[70]">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Thông báo</h3>
              <p className="text-xs text-secondary">Bình luận và trả lời mới</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(markAllNotificationsReadThunk())}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Đọc tất cả
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && <p className="px-4 py-4 text-sm text-secondary">Đang tải thông báo...</p>}
            {!loading && items.length === 0 && <p className="px-4 py-5 text-center text-sm text-secondary">Chưa có thông báo.</p>}
            {!loading && items.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`w-full border-b border-outline-variant px-4 py-3 text-left hover:bg-surface-container-low transition-colors ${!notification.isRead ? 'bg-primary-fixed/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <img
                    alt="Sender avatar"
                    className="h-8 w-8 rounded-full border border-outline-variant object-cover"
                    src={notification.sender?.avatar && notification.sender.avatar !== 'default-avatar.png'
                      ? notification.sender.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender?.fullName || 'U')}&background=0066cc&color=fff&size=32`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-secondary line-clamp-2">{notification.message}</p>
                    <p className="mt-1 text-xs text-outline line-clamp-1">{notification.post?.title || 'Bài viết'}</p>
                    <p className="mt-1 text-[11px] text-outline">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <button
          type="button"
          onClick={() => openNotification(toast)}
          className="fixed right-4 top-20 z-[90] w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-primary/20 bg-surface-container-lowest p-4 text-left shadow-xl hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-primary">notifications_active</span>
            <div>
              <p className="text-sm font-bold text-on-surface">{toast.title}</p>
              <p className="mt-1 text-xs text-secondary">{toast.message}</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
