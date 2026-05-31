import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

const getRequestToken = (req) => {
    const cookieToken = req.cookies?.token || req.cookies?.accessToken;
    if (cookieToken) return cookieToken;

    const authHeader = req.headers?.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    return '';
};

// ====================================================================
// LỚP 3 - AUTHENTICATION (XÁC THỰC)
// Lấy Token từ HttpOnly Cookie, fallback Authorization Bearer
// ====================================================================
export const authenticateToken = (req, res, next) => {
    const token = getRequestToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Yêu cầu cần có access token' });
    }

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
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
        }
        next();
    };
};

// ====================================================================
// OPTIONAL AUTHENTICATION
// Decode token nếu có, bỏ qua nếu không có/không hợp lệ (cho public API)
// ====================================================================
export const optionalAuthenticateToken = (req, res, next) => {
    const token = getRequestToken(req);
    if (!token) return next();

    const secret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET;

    jwt.verify(token, secret, (err, decoded) => {
        if (!err && decoded) {
            req.user = {
                userId: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
        }
        next();
    });
};
