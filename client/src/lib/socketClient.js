import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const connectSocket = (token) => {
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    auth: { token },
    withCredentials: true,
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
