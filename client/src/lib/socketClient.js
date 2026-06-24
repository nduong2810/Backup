import { io } from 'socket.io-client';

let socket = null;
const joinedPostRooms = new Set();

const getSocketUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  // Lấy base URL của backend (bỏ phần /api)
  return apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

const rememberPostRoomEvents = (socketInstance) => {
  const originalEmit = socketInstance.emit.bind(socketInstance);

  socketInstance.emit = (eventName, ...args) => {
    if (eventName === 'post:join' && args[0]) {
      joinedPostRooms.add(String(args[0]));
    }

    if (eventName === 'post:leave' && args[0]) {
      joinedPostRooms.delete(String(args[0]));
    }

    return originalEmit(eventName, ...args);
  };

  socketInstance.on('connect', () => {
    joinedPostRooms.forEach((postId) => {
      originalEmit('post:join', postId);
    });
  });
};

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  rememberPostRoomEvents(socket);

  // Ngừng reconnect nếu server từ chối do chưa đăng nhập (UNAUTHORIZED)
  socket.on('connect_error', (err) => {
    if (err?.message === 'UNAUTHORIZED') {
      socket.disconnect();
      socket = null;
    }
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) return connectSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    joinedPostRooms.clear();
  }
};