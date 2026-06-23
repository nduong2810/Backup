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
    // API Đăng ký
    async register(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { fullName, email, password } = req.body;
            await authService.registerUser(fullName, email, password);

            res.status(201).json({
                message: "Đăng ký thành công!\nVui lòng kiểm tra email để kích hoạt tài khoản"
            });
        } catch (error) {
            const status = error.message === "Email đã được sử dụng" ? 409 : 400;
            res.status(status).json({ message: error.message });
        }
    }

    //  API Xác thực OTP
    async verifyOTP(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email, otp } = req.body;
            await authService.verifyActivationOTP(email, otp);

            res.status(200).json({
                message: "Tài khoản đã được kích hoạt!\nBạn có thể đăng nhập"
            });
        } catch (error) {
            const status = error.message === "Email không tồn tại" ? 404 : 400;
            res.status(status).json({ message: error.message });
        }
    }

    async resendOTP(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email } = req.body;
            await authService.resendActivationOTP(email);

            res.status(200).json({
                message: "OTP đã được gửi lại. Vui lòng kiểm tra email"
            });
        } catch (error) {
            const status = error.message === "Email không tồn tại" ? 404 : 400;
            res.status(status).json({ message: error.message });
        }
    }

    async login(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const { email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.login(email, password);

            // Thiết lập cookie cho Access Token (15 phút) và Refresh Token (7 ngày)
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            const redirectUrl = user.role === 'admin' ? '/' : '/';

            res.status(200).json({
                message: 'Đăng nhập thành công',
                user,
                redirectUrl,
            });
        } catch (error) {
            const status = error.status || 400;
            res.status(status).json({
                message: error.message,
                code: error.code,
                email: error.email
            });
        }
    }

    async logout(req, res) {
        try {
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            };

            // Xóa toàn bộ các cookie liên quan đến phiên đăng nhập
            res.clearCookie('token', cookieOptions);
            res.clearCookie('accessToken', cookieOptions);
            res.clearCookie('refreshToken', cookieOptions);

            res.status(200).json({
                success: true,
                message: "Đăng xuất thành công"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Lỗi khi đăng xuất: " + error.message
            });
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

    async getProfile(req, res) {
        try {
            const user = await authService.getUserProfile(req.user.userId);
            
            res.status(200).json({
                success: true,
                user: user
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAdminProfile(req, res) {
        try {
            const user = await authService.getUserProfile(req.user.userId);

            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản admin' });
            }

            res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProfile(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId; 
            const updateData = req.body;

            const updatedUser = await authService.updateUserProfile(userId, updateData);

            res.status(200).json({
                success: true,
                message: "Cập nhật thông tin thành công",
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async requestReactivateOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: "Email không được để trống" });
            }
            await authService.requestReactivateOtp(email.trim());
            res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async verifyReactivateOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email và mã OTP không được để trống" });
            }
            await authService.verifyReactivateOTP(email.trim(), otp.trim());
            res.status(200).json({ success: true, message: "Kích hoạt lại tài khoản thành công! Bạn có thể đăng nhập ngay." });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async requestCancelDeletionOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: "Email không được để trống" });
            }
            await authService.requestCancelDeletionOtp(email.trim());
            res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async verifyCancelDeletionOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email và mã OTP không được để trống" });
            }
            await authService.verifyCancelDeletionOtp(email.trim(), otp.trim());
            res.status(200).json({ success: true, message: "Hủy yêu cầu xóa tài khoản thành công! Bạn có thể đăng nhập ngay." });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new AuthController();
