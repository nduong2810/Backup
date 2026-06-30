import express from 'express';
import notificationController from '../controller/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, notificationController.getMyNotifications.bind(notificationController));
router.patch('/:id/read', authenticateToken, notificationController.markAsRead.bind(notificationController));
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead.bind(notificationController));

export default router;
