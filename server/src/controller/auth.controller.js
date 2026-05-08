import authService from '../service/auth.service.js';
import { validationResult } from 'express-validator';

class AuthController {
    checkValidationErrors(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        return null;
    }

    async forgotPassword(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            await authService.requestPasswordReset(req.body.email);
            res.status(200).json({ message: "OTP đã gửi đến email của bạn" });
        } catch (error) {
            const status = error.message === "Email chưa đăng ký" ? 404 : 400;
            res.status(status).json({ message: error.message });
        }
    }

    async verifyResetOTP(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email, otp } = req.body;
            const resetToken = await authService.verifyResetOTP(email, otp);
            res.status(200).json({ message: "Xác thực thành công", resetToken });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async resetPassword(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email, resetToken, newPassword } = req.body;
            await authService.resetUserPassword(email, resetToken, newPassword);
            res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

export default new AuthController();