import express from 'express';
import userController from '../controller/user.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Route xem Profile (Cần lớp 3, 4)
router.get('/profile', authenticateToken, authorizeRole('user'), userController.getMyProfile);

// Route sửa Profile (Cần lớp 1, 2, 3, 4) 
router.put('/profile', 
    authenticateToken, 
    authorizeRole('user'), 
    authLimiter, // Lớp 2
    [
        body('fullName').optional().notEmpty().withMessage('Tên không được để trống'), // Lớp 1 
        body('phone').optional().isMobilePhone('vi-VN').withMessage('SĐT không hợp lệ'),
        body('bio').optional().isLength({ max: 500 }).withMessage('Bio tối đa 500 ký tự')
    ],
    userController.updateMyProfile
);

// Route đổi mật khẩu
router.put('/change-password',
    authenticateToken,
    authLimiter,
    [
        body('oldPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
        body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự')
    ],
    userController.changeMyPassword
);

export default router;