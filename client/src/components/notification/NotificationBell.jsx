import { useEffect, useMemo, useRef, useState } from 'react';
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

const TOAST_DURATION_MS = 4200;
const FALLBACK_REFRESH_MS = 12000;

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

const getAvatarUrl = (user) => {
  if (user?.avatar && user.avatar !== 'default-avatar.png') return user.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=0066cc&color=fff&size=32`;
};

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.login);
  const { items, unreadCount, loading } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const wrapperRef = useRef(null);
  const toastTimersRef = useRef({});
  const knownNotificationIdsRef = useRef(new Set());
  const socketConnectedRef = useRef(false);

  const badgeText = useMemo(() => {
    if (!unreadCount || unreadCount <= 0) return '';
    return unreadCount > 9 ? '9+' : String(unreadCount);
  }, [unreadCount]);

  const removeToast = (notificationId) => {
    if (!notificationId) return;

    window.clearTimeout(toastTimersRef.current[notificationId]);
    delete toastTimersRef.current[notificationId];
    setToasts((current) => current.filter((item) => String(item._id) !== String(notificationId)));
  };

  const addToast = (notification) => {
    if (!notification?._id) return;

    setToasts((current) => {
      const filtered = current.filter((item) => String(item._id) !== String(notification._id));
      return [notification, ...filtered].slice(0, 3);
    });

    window.clearTimeout(toastTimersRef.current[notification._id]);
    toastTimersRef.current[notification._id] = window.setTimeout(() => {
      removeToast(notification._id);
    }, TOAST_DURATION_MS);
  };

  const syncKnownNotifications = (notifications = []) => {
    notifications.forEach((notification) => {
      if (notification?._id) knownNotificationIdsRef.current.add(String(notification._id));
    });
  };

  useEffect(() => {
    if (!user) return undefined;

    dispatch(fetchNotificationsThunk()).unwrap().then((data) => {
      syncKnownNotifications(data?.notifications || []);
    }).catch(() => {});

    const socket = connectSocket();

    const handleConnect = () => {
      socketConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      socketConnectedRef.current = false;
    };

    const handleNewNotification = (payload) => {
      const notification = payload?.notification;
      if (notification?._id) {
        knownNotificationIdsRef.current.add(String(notification._id));
      }
      dispatch(pushRealtimeNotification(payload));
      if (notification) addToast(notification);
    };

    const handleUnreadCount = (payload) => {
      dispatch(setUnreadCount(payload));
    };

    socket?.on('connect', handleConnect);
    socket?.on('disconnect', handleDisconnect);
    socket?.on('notification:new', handleNewNotification);
    socket?.on('notification:unread-count', handleUnreadCount);

    const fallbackIntervalId = window.setInterval(async () => {
      const action = await dispatch(fetchNotificationsThunk());
      const notifications = action.payload?.notifications || [];
      const newNotifications = notifications.filter((notification) => {
        if (!notification?._id || notification.isRead) return false;
        return !knownNotificationIdsRef.current.has(String(notification._id));
      });

      syncKnownNotifications(notifications);

      if (!socketConnectedRef.current) {
        newNotifications.slice(0, 3).forEach(addToast);
      }
    }, FALLBACK_REFRESH_MS);

    return () => {
      socket?.off('connect', handleConnect);
      socket?.off('disconnect', handleDisconnect);
      socket?.off('notification:new', handleNewNotification);
      socket?.off('notification:unread-count', handleUnreadCount);
      window.clearInterval(fallbackIntervalId);
      Object.values(toastTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current = {};
      disconnectSocket();
    };
  }, [user, dispatch]);

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
    removeToast(notification._id);
    if (!notification.isRead) {
      await dispatch(markNotificationReadThunk(notification._id));
    }
    setOpen(false);
    navigate(notification.link || `/posts/${notification.post?._id || notification.post}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <style>{`
        @keyframes notification-toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes notification-toast-enter {
          from { opacity: 0; transform: translateY(-8px) translateX(8px); }
          to { opacity: 1; transform: translateY(0) translateX(0); }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-secondary hover:bg-surface-container-low hover:text-primary transition-colors"
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {badgeText && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {badgeText}
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
                    src={getAvatarUrl(notification.sender)}
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

      {toasts.length > 0 && (
        <div className="fixed right-5 top-20 z-[90] flex w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast._id}
              className="overflow-hidden rounded-md border border-emerald-100 bg-white text-left shadow-lg ring-1 ring-black/5"
              style={{ animation: 'notification-toast-enter 160ms ease-out' }}
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <button
                  type="button"
                  onClick={() => openNotification(toast)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-[15px] font-bold text-slate-800">{toast.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">{toast.message}</p>
                </button>
                <button
                  type="button"
                  onClick={() => removeToast(toast._id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Tắt thông báo"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="h-[3px] bg-transparent">
                <div
                  className="h-full bg-emerald-500"
                  style={{ animation: `notification-toast-progress ${TOAST_DURATION_MS}ms linear forwards` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
