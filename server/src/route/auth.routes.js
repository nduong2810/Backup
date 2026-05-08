import express from 'express';
import authController from '../controller/auth.controller.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import { forgotPasswordValidation, loginValidation, resetPasswordValidation } from '../validation/auth.validation.js';

const router = express.Router();

// ==================== LOGIN ====================
// Pipeline: Rate Limiting (Lớp 2) → Validation (Lớp 1) → Controller
router.post('/login',
    authLimiter,                                    // Lớp 2: Rate Limiting
    loginValidation,                                // Lớp 1: Input Validation (rules)
    authController.login.bind(authController)       // Controller
);

// ==================== USER PROFILE ====================
// Pipeline: Auth (Lớp 3) → Authorization user (Lớp 4) → Controller
router.get('/user/profile',
    authMiddleware,                                 // Lớp 3: JWT Authentication
    roleMiddleware('user', 'admin'),                // Lớp 4: Authorization (user + admin đều xem được)
    (req, res) => {
        res.status(200).json({
            message: 'User Profile',
            user: req.user,
        });
    }
);

// ==================== ADMIN PROFILE ====================
// Pipeline: Auth (Lớp 3) → Authorization admin only (Lớp 4) → Controller
router.get('/admin/profile',
    authMiddleware,                                 // Lớp 3: JWT Authentication
    roleMiddleware('admin'),                        // Lớp 4: Authorization (chỉ admin)
    (req, res) => {
        res.status(200).json({
            message: 'Admin Profile',
            user: req.user,
        });
    }
);

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', 
    authLimiter, 
    forgotPasswordValidation, 
    authController.forgotPassword.bind(authController)
);

router.post('/verify-reset-otp', 
    authLimiter, 
    authController.verifyResetOTP.bind(authController)
);

router.post('/reset-password', 
    authLimiter, 
    resetPasswordValidation, 
    authController.resetPassword.bind(authController)
);

export default router;