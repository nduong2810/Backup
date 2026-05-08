import userRepository from '../repository/user.repository.js';
import sendEmail from '../util/email.util.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

class AuthService {
    async login(email, password) {
        // Tìm user theo email
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
        }

        // So sánh password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
        }

        // Kiểm tra tài khoản đã kích hoạt chưa
        if (!user.isActive) {
            throw { status: 403, message: 'Tài khoản chưa được kích hoạt' };
        }

        // Tạo JWT token (chứa id và role)
        const token = jwt.sign(
            { id: user._id, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        // Ẩn password trước khi trả về
        const userObj = user.toObject();
        delete userObj.password;

        return { user: userObj, token };
    }

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