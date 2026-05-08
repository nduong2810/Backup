import jwt from 'jsonwebtoken';
import env from '../config/environment.js';

// ====================================================================
// LỚP 3 - AUTHENTICATION (JWT)
// Xác thực user qua JWT token trong HttpOnly cookie
// ====================================================================

const authMiddleware = (req, res, next) => {
    try {
        // Lấy token từ HttpOnly cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
        }

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // Gán thông tin user vào request để các middleware/controller sau dùng
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
        }
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

export default authMiddleware;
