import userRepository from '../repository/user.repository.js';
import sendEmail from '../util/email.util.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class AuthService {
    async requestPasswordReset(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email chưa đăng ký");

        // Tạo OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000; // Hạn 5 phút

        await userRepository.updateUserByEmail(email, {
            resetOTP: otp,
            resetOTPExpiry: otpExpiry
        });

        const message = `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Đặt lại mật khẩu - IT Forum", message);
    }

    async verifyResetOTP(email, otp) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");

        if (!user.resetOTP || user.resetOTP !== otp) throw new Error("OTP không chính xác");
        if (Date.now() > user.resetOTPExpiry) throw new Error("OTP đã hết hạn");

        // Tạo resetToken ngẫu nhiên
        const resetToken = crypto.randomBytes(32).toString('hex');
        await userRepository.updateUserByEmail(email, { resetToken });

        return resetToken;
    }

    async resetUserPassword(email, resetToken, newPassword) {
        const user = await userRepository.findByEmail(email);
        if (!user || user.resetToken !== resetToken) {
            throw new Error("Phiên không hợp lệ hoặc đã hết hạn");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userRepository.updateUserByEmail(email, {
            password: hashedPassword,
            resetOTP: null,
            resetOTPExpiry: null,
            resetToken: null
        });
    }
}

export default new AuthService();