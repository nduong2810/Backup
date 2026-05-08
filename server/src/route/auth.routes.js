import express from 'express';
import authController from '../controller/auth.controller.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { forgotPasswordValidation, resetPasswordValidation } from '../validation/auth.validation.js';

const router = express.Router();

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