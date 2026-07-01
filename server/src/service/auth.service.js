import userRepository from '../repository/user.repository.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import pendingUserRepository from '../repository/pendingUser.repository.js';
import sendEmail from '../util/email.util.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

const OTP_EXPIRES_IN_MS = 5 * 60 * 1000;

const generateOtpPayload = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRES_IN_MS);
    return { otp, otpExpiry };
};

class AuthService {

    // Logic Đăng ký tài khoản
    async registerUser(fullName, email, password) {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            if (existingUser.status === 'banned') {
                throw new Error("Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ quản trị viên để mở khóa tài khoản!");
            }
            if (existingUser.status === 'deactivated') {
                throw new Error("Tài khoản của bạn hiện đang bị vô hiệu hóa. Vui lòng đăng nhập để thực hiện kích hoạt lại tài khoản!");
            }
            if (existingUser.status === 'pending_delete') {
                throw new Error("Tài khoản của bạn đang trong trạng thái chờ xóa. Vui lòng đăng nhập để hủy yêu cầu xóa tài khoản!");
            }
            if (existingUser.isActive) {
                throw new Error("Email đã được sử dụng");
            }
            // Trường hợp: đã đăng ký nhưng chưa kích hoạt tài khoản (isActive là false và không bị ban / vô hiệu hóa / chờ xóa)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const { otp, otpExpiry } = generateOtpPayload();
            await userRepository.updateUserByEmail(email, {
                fullName,
                password: hashedPassword,
                otp,
                otpExpiry
            });
            const message = `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
            await sendEmail(email, "Kích hoạt tài khoản Forum", message);
            return;
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { otp, otpExpiry } = generateOtpPayload();

        const pendingUser = await pendingUserRepository.findByEmail(email);
        if (pendingUser) {
            await pendingUserRepository.updatePendingUserByEmail(email, {
                fullName,
                password: hashedPassword,
                otp,
                otpExpiry
            });
        } else {
            await pendingUserRepository.createPendingUser({
                fullName,
                email,
                password: hashedPassword,
                otp,
                otpExpiry
            });
        }

        // Gửi email chứa OTP
        const message = `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Kích hoạt tài khoản Forum", message);
    }

    //  Logic Xác thực OTP kích hoạt
    async verifyActivationOTP(email, otp) {
        const pendingUser = await pendingUserRepository.findByEmail(email);

        if (pendingUser) {
            if (pendingUser.otp !== otp) throw new Error("OTP không chính xác");
            if (Date.now() > pendingUser.otpExpiry) throw new Error("OTP đã hết hạn");

            const existingUser = await userRepository.findByEmail(email);
            if (existingUser) {
                if (existingUser.isActive) throw new Error("Tài khoản đã được kích hoạt");
                await userRepository.updateUserByEmail(email, {
                    isActive: true,
                    otp: null,
                    otpExpiry: null
                });
                await pendingUserRepository.deleteByEmail(email);
                return;
            }

            await userRepository.createUser({
                fullName: pendingUser.fullName,
                email: pendingUser.email,
                password: pendingUser.password,
                role: "user",
                isActive: true
            });

            await pendingUserRepository.deleteByEmail(email);
            return;
        }

        const user = await userRepository.findByEmail(email);

        if (!user) throw new Error("Email không tồn tại");
        if (user.isActive) throw new Error("Tài khoản đã được kích hoạt");
        if (!user.otp || user.otp !== otp) throw new Error("OTP không chính xác");
        if (Date.now() > user.otpExpiry) throw new Error("OTP đã hết hạn");

        // Cập nhật trạng thái và xóa OTP
        await userRepository.updateUserByEmail(email, {
            isActive: true,
            otp: null,
            otpExpiry: null
        });
    }

    async resendActivationOTP(email) {
        const pendingUser = await pendingUserRepository.findByEmail(email);
        const { otp, otpExpiry } = generateOtpPayload();

        if (pendingUser) {
            await pendingUserRepository.updatePendingUserByEmail(email, { otp, otpExpiry });

            const message = `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
            await sendEmail(email, "Kích hoạt tài khoản Forum", message);
            return;
        }

        const user = await userRepository.findByEmail(email);

        if (!user) throw new Error("Email không tồn tại");
        if (user.isActive) throw new Error("Tài khoản đã được kích hoạt");

        await userRepository.updateUserByEmail(email, {
            otp,
            otpExpiry
        });

        const message = `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Kích hoạt tài khoản Forum", message);
    }

    async login(email, password) {
        // Tìm user theo email
        const user = await userRepository.findByEmail(email);
        if (user && user.status === 'pending_delete' && user.deletionScheduledAt && new Date() >= user.deletionScheduledAt) {
            // Quá hạn 7 ngày, thực hiện xóa vĩnh viễn khỏi CSDL
            await User.findByIdAndDelete(user._id);
            throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
        }

        if (!user) {
            const pendingUser = await pendingUserRepository.findByEmail(email);
            if (pendingUser) {
                const isPasswordMatch = await bcrypt.compare(password, pendingUser.password);
                if (!isPasswordMatch) {
                    throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
                }

                const { otp, otpExpiry } = generateOtpPayload();
                await pendingUserRepository.updatePendingUserByEmail(email, { otp, otpExpiry });

                const message = `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
                await sendEmail(email, "Kích hoạt tài khoản Forum", message);

                throw {
                    status: 403,
                    code: 'ACCOUNT_NOT_ACTIVATED',
                    email: email,
                    message: 'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi vào email của bạn.'
                };
            }
            throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
        }

        // So sánh password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
        }

        // Kiểm tra tài khoản đã kích hoạt chưa hoặc đang ở các trạng thái đặc biệt
        if (!user.isActive) {
            if (user.status === 'banned') {
                throw { status: 403, message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ quản trị viên để mở khóa tài khoản!' };
            } else if (user.status === 'deactivated') {
                throw {
                    status: 403,
                    code: 'ACCOUNT_DEACTIVATED',
                    email: user.email,
                    message: 'Tài khoản của bạn hiện đang bị vô hiệu hóa. Bạn có muốn kích hoạt lại tài khoản không?'
                };
            } else if (user.status === 'pending_delete') {
                // Tính toán thời gian còn lại để khôi phục
                const diffMs = new Date(user.deletionScheduledAt).getTime() - Date.now();
                const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const timeRemainingStr = `${diffDays} ngày ${diffHours} giờ`;

                throw {
                    status: 403,
                    code: 'ACCOUNT_PENDING_DELETE',
                    email: user.email,
                    message: `Tài khoản của bạn đang trong trạng thái chờ xóa. Thời gian khôi phục còn lại: ${timeRemainingStr}. Bạn có muốn hủy yêu cầu xóa tài khoản không?`
                };
            }
            throw { status: 403, message: 'Tài khoản của bạn đã bị vô hiệu hóa, vui lòng liên hệ với quản trị viên để mở lại!' };
        }

        // Tạo Access Token (15 phút) và Refresh Token (7 ngày)
        const accessToken = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            env.JWT_SECRET + '_refresh',
            { expiresIn: '7d' }
        );

        // Ẩn password trước khi trả về
        const userObj = user.toObject();
        delete userObj.password;

        return { user: userObj, accessToken, refreshToken };
    }

    async requestPasswordReset(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email chưa đăng ký");

        // Tạo OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRES_IN_MS); // Hạn 5 phút

        await userRepository.updateUserByEmail(email, {
            resetOTP: otp,
            resetOTPExpiry: otpExpiry,
            resetToken: null,
            resetTokenExpiry: null
        });

        const message = `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Đặt lại mật khẩu - IT Forum", message);
    }

    async verifyResetOTP(email, otp) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");

        // TRƯỜNG HỢP 1: OTP đã bị xóa (null) nhưng vẫn còn resetToken 
        if (!user.resetOTP && user.resetToken) {
            throw new Error("Mã OTP này đã được sử dụng");
        }

        // TRƯỜNG HỢP 2: OTP không khớp hoặc không tồn tại
        if (!user.resetOTP || user.resetOTP !== otp) {
            throw new Error("OTP không chính xác");
        }

        // TRƯỜNG HỢP 3: OTP khớp nhưng đã quá thời gian hiệu lực
        if (Date.now() > user.resetOTPExpiry) {
            throw new Error("OTP đã hết hạn");
        }

        // Nếu vượt qua các lớp check trên thì tạo resetToken mới có hiệu lực trong 10 phút
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Vô hiệu hóa OTP và thiết lập resetToken
        await userRepository.updateUserByEmail(email, { 
            resetToken,
            resetTokenExpiry,
            resetOTP: null,         
            resetOTPExpiry: null    
        });

        return resetToken;
    }
    async getUserProfile(userId) {
        return await userRepository.findById(userId);
    }

    async resetUserPassword(email, resetToken, newPassword) {
        const user = await userRepository.findByEmail(email);
        if (!user || user.resetToken !== resetToken) {
            throw new Error("Phiên không hợp lệ hoặc đã hết hạn");
        }

        // Kiểm tra thời gian hết hạn của resetToken (10 phút)
        if (!user.resetTokenExpiry || Date.now() > user.resetTokenExpiry) {
            await userRepository.updateUserByEmail(email, {
                resetToken: null,
                resetTokenExpiry: null
            });
            throw new Error("Phiên đặt lại mật khẩu đã hết hạn");
        }

        // Kiểm tra mật khẩu mới có trùng mật khẩu cũ không
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userRepository.updateUserByEmail(email, {
            password: hashedPassword,
            resetOTP: null,
            resetOTPExpiry: null,
            resetToken: null,
            resetTokenExpiry: null
        });
    }

    async requestReactivateOtp(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");
        if (user.status !== 'deactivated') {
            throw new Error("Tài khoản không ở trạng thái vô hiệu hóa");
        }

        const { otp, otpExpiry } = generateOtpPayload();
        await userRepository.updateUserByEmail(email, { otp, otpExpiry });

        const message = `Mã OTP kích hoạt lại tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Xác nhận kích hoạt lại tài khoản IT Forum", message);
    }

    async verifyReactivateOTP(email, otp) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");
        if (user.status !== 'deactivated') {
            throw new Error("Tài khoản không ở trạng thái vô hiệu hóa");
        }

        if (!user.otp || user.otp !== otp) throw new Error("OTP không chính xác");
        if (Date.now() > user.otpExpiry) throw new Error("OTP đã hết hạn");

        await userRepository.updateUserByEmail(email, {
            isActive: true,
            status: 'active',
            otp: null,
            otpExpiry: null
        });

        await Promise.all([
            Post.updateMany({ author: user._id }, { $set: { isAuthorActive: true } }),
            Comment.updateMany({ author: user._id }, { $set: { isAuthorActive: true } })
        ]);
    }

    async requestCancelDeletionOtp(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");
        if (user.status !== 'pending_delete') {
            throw new Error("Tài khoản không ở trạng thái chờ xóa");
        }

        const { otp, otpExpiry } = generateOtpPayload();
        await userRepository.updateUserByEmail(email, { otp, otpExpiry });

        const message = `Mã OTP xác nhận hủy yêu cầu xóa tài khoản của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.`;
        await sendEmail(email, "Xác nhận hủy xóa tài khoản IT Forum", message);
    }

    async verifyCancelDeletionOtp(email, otp) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error("Email không tồn tại");
        if (user.status !== 'pending_delete') {
            throw new Error("Tài khoản không ở trạng thái chờ xóa");
        }

        if (!user.otp || user.otp !== otp) throw new Error("OTP không chính xác");
        if (Date.now() > user.otpExpiry) throw new Error("OTP đã hết hạn");

        await userRepository.updateUserByEmail(email, {
            isActive: true,
            status: 'active',
            deletionScheduledAt: null,
            otp: null,
            otpExpiry: null
        });

        await Promise.all([
            Post.updateMany({ author: user._id }, { $set: { isAuthorActive: true } }),
            Comment.updateMany({ author: user._id }, { $set: { isAuthorActive: true } })
        ]);
    }
}

export default new AuthService();