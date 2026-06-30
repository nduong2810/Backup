import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/environment.js';
import corsOptions from '../config/cors.js';

let ioInstance = null;

const parseCookie = (cookieString, cookieName) => {
  if (!cookieString) return '';
  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    const [name, ...value] = cookie.trim().split('=');
    if (name && value.length) {
      acc[name] = value.join('=');
    }
    return acc;
  }, {});
  return cookies[cookieName] || '';
};

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const bearer = socket.handshake.headers?.authorization || '';
  if (bearer.startsWith('Bearer ')) return bearer.slice(7).trim();

  return '';
};

const getUserIdFromSocket = (socket) => socket.user?.userId || socket.user?.id || '';

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use((socket, next) => {
    const cookieHeader = socket.handshake.headers?.cookie;
    const accessToken = parseCookie(cookieHeader, 'accessToken') || parseCookie(cookieHeader, 'token') || getTokenFromSocket(socket);
    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, secret);
        socket.user = {
          userId: decoded.id || decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
        return next();
      } catch (error) {
        // Thử xác thực bằng Refresh Token nếu Access Token hết hạn
      }
    }

    const refreshToken = parseCookie(cookieHeader, 'refreshToken');
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, secret + '_refresh');
        socket.user = {
          userId: decodedRefresh.id || decodedRefresh.userId,
          email: decodedRefresh.email,
          role: decodedRefresh.role,
        };
        return next();
      } catch (error) {
        // Nếu token không hợp lệ thì vẫn cho socket ẩn danh để nhận realtime bài viết công khai.
      }
    }

    socket.user = null;
    return next();
  });

  ioInstance.on('connection', (socket) => {
    const userId = getUserIdFromSocket(socket);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('post:join', (postId) => {
      if (postId) socket.join(`post:${postId}`);
    });

    socket.on('post:leave', (postId) => {
      if (postId) socket.leave(`post:${postId}`);
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId || !eventName) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
};

export const emitToPostRoom = (postId, eventName, payload) => {
  if (!ioInstance || !postId || !eventName) return;
  ioInstance.to(`post:${postId}`).emit(eventName, payload);
};