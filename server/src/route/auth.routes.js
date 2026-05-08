import express from 'express';
import authController from '../controller/auth.controller.js';
import userController from '../controller/user.controller.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
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
router.get('/user/profile', 
    authenticateToken, 
    authorizeRole('user'), 
    userController.getMyProfile.bind(userController)
);

router.put('/user/profile', 
    authenticateToken, 
    authorizeRole('user'), 
    authLimiter, 
    userController.updateMyProfile.bind(userController)
);

router.put('/user/change-password',
    authenticateToken,
    authLimiter,
    userController.changeMyPassword.bind(userController)
);

// ==================== ADMIN PROFILE ====================
// Pipeline: Auth (Lớp 3) → Authorization admin only (Lớp 4) → Controller
router.get('/admin/profile',
    authenticateToken,                             // Lớp 3: Authentication [cite: 428]
    authorizeRole('admin'),                        // Lớp 4: Authorization [cite: 430]
    (req, res) => {
        res.status(200).json({
            success: true,
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