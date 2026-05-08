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

    async login(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email, password } = req.body;
            const { user, token } = await authService.login(email, password);

            // Set JWT vào HttpOnly cookie (bảo mật chống XSS)
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            // Trả URL redirect theo role
            const redirectUrl = user.role === 'admin' ? '/admin/profile' : '/user/profile';

            res.status(200).json({
                message: 'Đăng nhập thành công',
                user,
                redirectUrl,
            });
        } catch (error) {
            const status = error.status || 400;
            res.status(status).json({ message: error.message });
        }
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