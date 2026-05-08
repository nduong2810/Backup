// ====================================================================
// LỚP 4 - AUTHORIZATION (Role-based)
// Phân quyền dựa trên role của user (user/admin)
// Phải đặt SAU authMiddleware (vì cần req.user từ JWT)
// ====================================================================

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra đã qua authentication chưa
        if (!req.user) {
            return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
        }

        // Kiểm tra role có được phép không
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
        }

        next();
    };
};

export default roleMiddleware;
