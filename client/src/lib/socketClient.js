import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  // Lấy base URL của backend (bỏ phần /api)
  return apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const connectSocket = () => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  // Ngừng reconnect nếu server từ chối do chưa đăng nhập (UNAUTHORIZED)
  socket.on('connect_error', (err) => {
    if (err?.message === 'UNAUTHORIZED') {
      socket.disconnect();
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
