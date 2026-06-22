import express from 'express';
import authController from '../controller/auth.controller.js';
import adminController from '../controller/admin.controller.js';
import adminPostStatusController from '../controller/adminPostStatus.controller.js';
import adminAuditLogController from '../controller/adminAuditLog.controller.js';
import adminUserStatusController from '../controller/adminUserStatus.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = express.Router();
const adminOnly = [authenticateToken, authorizeRole('admin')];

router.get('/profile', ...adminOnly, authController.getAdminProfile.bind(authController));
router.get('/dashboard-stats', ...adminOnly, adminController.getDashboardStats.bind(adminController));
router.get('/audit-logs', ...adminOnly, adminAuditLogController.list.bind(adminAuditLogController));

router.get('/settings', authenticateToken, authorizeRole('admin'), adminController.getSystemSettings.bind(adminController));
router.put('/settings', authenticateToken, authorizeRole('admin'), adminController.updateSystemSetting.bind(adminController));

router.get('/posts', ...adminOnly, adminController.getManagedPosts.bind(adminController));
router.patch('/posts/:postId/status', ...adminOnly, adminPostStatusController.updatePostStatus.bind(adminPostStatusController));

router.post('/tags', ...adminOnly, adminController.createTag.bind(adminController));
router.put('/tags/:tagId', ...adminOnly, adminController.updateTag.bind(adminController));
router.delete('/tags/:tagId', ...adminOnly, adminController.deleteTag.bind(adminController));

router.get('/users', ...adminOnly, adminController.getManagedUsers.bind(adminController));
router.get('/users/:userId', ...adminOnly, adminController.getUserDetail.bind(adminController));
router.patch('/users/:userId/status', ...adminOnly, adminUserStatusController.toggleUserStatus.bind(adminUserStatusController));

export default router;
