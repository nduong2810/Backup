import express from 'express';
import authController from '../controller/auth.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== ADMIN PROFILE ====================
// Pipeline: Authentication (Lớp 3) → Authorization admin (Lớp 4) → Controller
router.get('/profile', 
    authenticateToken,                                      // Lớp 3: Xác thực JWT
    authorizeRole('admin'),                                 // Lớp 4: Chỉ admin mới được truy cập
    authController.getAdminProfile.bind(authController)     // Controller xử lý
);

export default router;
