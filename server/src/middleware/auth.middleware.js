import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

// ====================================================================
// LỚP 3 - AUTHENTICATION (XÁC THỰC)
// Lấy Token từ HttpOnly Cookie để chống tấn công XSS 
// ====================================================================
export const authenticateToken = (req, res, next) => {
    // Lấy token từ Cookie
    const token = req.cookies?.token || req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({ message: 'Yêu cầu cần có access token' });
    }

    // Sử dụng Secret Key từ file cấu hình environment
    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        req.user = {
            userId: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    });
};

// ====================================================================
// LỚP 4 - AUTHORIZATION (PHÂN QUYỀN)
// Kiểm tra quyền hạn trước khi cho phép can thiệp dữ liệu
// ====================================================================
export const authorizeRole = (role) => {
    return (req, res, next) => {
        // Nguyên tắc phân quyền tối thiểu: Đúng role hoặc là Admin
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
        }
        next();
    };
};