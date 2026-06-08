import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/environment.js';
import corsOptions from '../config/cors.js';

let ioInstance = null;

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
    const token = getTokenFromSocket(socket);
    if (!token) return next(new Error('UNAUTHORIZED'));

    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;
    jwt.verify(token, secret, (error, decoded) => {
      if (error || !decoded) return next(new Error('UNAUTHORIZED'));

      socket.user = {
        userId: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    });
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
