import express from 'express';
import authController from '../controller/auth.controller.js';
import adminController from '../controller/admin.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = express.Router();
const adminOnly = [authenticateToken, authorizeRole('admin')];

// ==================== ADMIN PROFILE ====================
router.get('/profile',
    ...adminOnly,
    authController.getAdminProfile.bind(authController)
);

// ==================== ADMIN DASHBOARD ====================
router.get('/dashboard-stats',
    ...adminOnly,
    adminController.getDashboardStats.bind(adminController)
);


// ==================== SYSTEM SETTINGS ====================
router.get('/settings',
    authenticateToken,
    authorizeRole('admin'),
    adminController.getSystemSettings.bind(adminController)
);

router.put('/settings',
    authenticateToken,
    authorizeRole('admin'),
    adminController.updateSystemSetting.bind(adminController)
);


// ==================== ADMIN POST MANAGEMENT ====================
router.get('/posts',
    ...adminOnly,
    adminController.getManagedPosts.bind(adminController)
);

router.patch('/posts/:postId/status',
    ...adminOnly,
    adminController.updatePostStatus.bind(adminController)
);

// ==================== ADMIN TAG MANAGEMENT ====================
router.post('/tags',
    ...adminOnly,
    adminController.createTag.bind(adminController)
);

router.put('/tags/:tagId',
    ...adminOnly,
    adminController.updateTag.bind(adminController)
);

router.delete('/tags/:tagId',
    ...adminOnly,
    adminController.deleteTag.bind(adminController)
);

// ==================== ADMIN USER MANAGEMENT ====================
router.get('/users',
    ...adminOnly,
    adminController.getManagedUsers.bind(adminController)
);

router.get('/users/:userId',
    ...adminOnly,
    adminController.getUserDetail.bind(adminController)
);

router.patch('/users/:userId/status',
    ...adminOnly,
    adminController.toggleUserStatus.bind(adminController)
);

export default router;
