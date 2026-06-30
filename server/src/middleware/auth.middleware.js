import jwt from 'jsonwebtoken';
import env from '../config/environment.js';
import User from '../model/user.model.js';

// ====================================================================
// LỚP 3 - AUTHENTICATION (XÁC THỰC)
// Đọc Token từ HttpOnly Cookie, tự động làm mới bằng Refresh Token
// ====================================================================
export const authenticateToken = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;
    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, secret);
            req.user = {
                userId: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            // Kiểm tra trạng thái hoạt động của tài khoản trong cơ sở dữ liệu
            const user = await User.findById(req.user.userId).select('isActive');
            if (!user || !user.isActive) {
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                };
                res.clearCookie('accessToken', cookieOptions);
                res.clearCookie('refreshToken', cookieOptions);
                return res.status(403).json({ code: 'USER_LOCKED', message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ admin để mở khóa tài khoản!' });
            }

            return next();
        } catch (err) {
            // Access token hết hạn hoặc không hợp lệ, tiếp tục kiểm tra Refresh Token
        }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không tồn tại' });
    }

    try {
        const decodedRefresh = jwt.verify(refreshToken, secret + '_refresh');

        // Kiểm tra trạng thái hoạt động của tài khoản trước khi làm mới token
        const user = await User.findById(decodedRefresh.id || decodedRefresh.userId).select('isActive');
        if (!user || !user.isActive) {
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            };
            res.clearCookie('accessToken', cookieOptions);
            res.clearCookie('refreshToken', cookieOptions);
            return res.status(403).json({ code: 'USER_LOCKED', message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ admin để mở khóa tài khoản!' });
        }

        // Tạo Access Token mới (15 phút)
        const newAccessToken = jwt.sign(
            { id: decodedRefresh.id || decodedRefresh.userId, role: decodedRefresh.role, email: decodedRefresh.email },
            secret,
            { expiresIn: '15m' }
        );

        // Thiết lập lại cookie Access Token mới
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        req.user = {
            userId: decodedRefresh.id || decodedRefresh.userId,
            email: decodedRefresh.email,
            role: decodedRefresh.role
        };
        return next();
    } catch (err) {
        // Clear expired cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        };
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    }
};

// ====================================================================
// LỚP 4 - AUTHORIZATION (PHÂN QUYỀN)
// Kiểm tra quyền hạn trước khi cho phép can thiệp dữ liệu
// ====================================================================
export const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
        }
        next();
    };
};

// ====================================================================
// OPTIONAL AUTHENTICATION
// Decode token nếu có, tự động refresh nếu accessToken hết hạn
// ====================================================================
export const optionalAuthenticateToken = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;
    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, secret);
            req.user = {
                userId: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            // Kiểm tra trạng thái hoạt động của tài khoản
            const user = await User.findById(req.user.userId).select('isActive');
            if (!user || !user.isActive) {
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                };
                res.clearCookie('accessToken', cookieOptions);
                res.clearCookie('refreshToken', cookieOptions);
                delete req.user;
                return res.status(403).json({ code: 'USER_LOCKED', message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ admin để mở khóa tài khoản!' });
            }

            return next();
        } catch (err) {
            // Qua bước check refresh token
        }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        try {
            const decodedRefresh = jwt.verify(refreshToken, secret + '_refresh');

            // Kiểm tra trạng thái hoạt động của tài khoản trước khi làm mới token
            const user = await User.findById(decodedRefresh.id || decodedRefresh.userId).select('isActive');
            if (!user || !user.isActive) {
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                };
                res.clearCookie('accessToken', cookieOptions);
                res.clearCookie('refreshToken', cookieOptions);
                return res.status(403).json({ code: 'USER_LOCKED', message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ admin để mở khóa tài khoản!' });
            }

            const newAccessToken = jwt.sign(
                { id: decodedRefresh.id || decodedRefresh.userId, role: decodedRefresh.role, email: decodedRefresh.email },
                secret,
                { expiresIn: '15m' }
            );

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });

            req.user = {
                userId: decodedRefresh.id || decodedRefresh.userId,
                email: decodedRefresh.email,
                role: decodedRefresh.role
            };
        } catch (err) {
            // Bỏ qua lỗi nếu không thể refresh trong route tùy chọn
        }
    }
    next();
};
