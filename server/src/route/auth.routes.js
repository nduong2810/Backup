import express from 'express';
import authController from '../controller/auth.controller.js';
import userController from '../controller/user.controller.js';
import { 
    registerLimiter, 
    loginLimiter, 
    otpLimiter, 
    passwordResetLimiter 
} from '../middleware/rateLimit.middleware.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { forgotPasswordValidation, loginValidation, resendOtpValidation, resetPasswordValidation, registerValidation, verifyOtpValidation } from '../validation/auth.validation.js';

const router = express.Router();

// ==================== REGISTER & VERIFY OTP ====================
// Pipeline: Rate Limiting (Lớp 2) → Validation (Lớp 1) → Controller
router.post('/register',
    registerLimiter,                                // Lớp 2: Rate Limiting chống spam
    registerValidation,                             // Lớp 1: Input Validation làm sạch dữ liệu
    authController.register.bind(authController)    // Controller xử lý
);

router.post('/verify-otp',
    otpLimiter,                                     // Lớp 2: Rate Limiting chống dò mã OTP
    verifyOtpValidation,                            // Lớp 1: Kiểm tra đầu vào
    authController.verifyOTP.bind(authController)
);

router.post('/resend-otp',
    otpLimiter,
    resendOtpValidation,
    authController.resendOTP.bind(authController)
);

// ==================== LOGIN ====================
// Pipeline: Rate Limiting (Lớp 2) → Validation (Lớp 1) → Controller
router.post('/login',
    loginLimiter,                                   // Lớp 2: Rate Limiting
    loginValidation,                                // Lớp 1: Input Validation (rules)
    authController.login.bind(authController)       // Controller
);

// THÊM API LOGOUT VÀO ĐÂY
router.post('/logout',
    authController.logout.bind(authController)
);

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', 
    passwordResetLimiter, 
    forgotPasswordValidation, 
    authController.forgotPassword.bind(authController)
);

router.post('/verify-reset-otp', 
    otpLimiter, 
    authController.verifyResetOTP.bind(authController)
);

router.post('/reset-password', 
    passwordResetLimiter, 
    resetPasswordValidation, 
    authController.resetPassword.bind(authController)
);

export default router;