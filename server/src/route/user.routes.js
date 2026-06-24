import express from 'express';
import userController from '../controller/user.controller.js';
import statisticsController from '../controller/statistics.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { profileUpdateLimiter } from '../middleware/rateLimit.middleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Route thống kê hoạt động user (Cần lớp 3, 4)
router.get('/statistics', authenticateToken, authorizeRole('user'), statisticsController.getMyStatistics);
router.get('/statistics/posts', authenticateToken, authorizeRole('user'), statisticsController.getMyPostsPaginated.bind(statisticsController));
router.get('/statistics/comments', authenticateToken, authorizeRole('user'), statisticsController.getMyCommentsPaginated.bind(statisticsController));
router.get('/statistics/votes', authenticateToken, authorizeRole('user'), statisticsController.getMyVotesPaginated.bind(statisticsController));
router.get('/statistics/reputation', authenticateToken, authorizeRole('user'), statisticsController.getMyReputationPaginated.bind(statisticsController));


// Route xem Profile (Cần lớp 3, 4)
router.get('/profile', authenticateToken, authorizeRole('user'), userController.getMyProfile);

router.get('/search-authors', [
    query('q').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Từ khóa tìm kiếm phải có 2-80 ký tự'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Số lượng gợi ý không hợp lệ')
], userController.searchAuthors);

// Route public cho hồ sơ tác giả + lịch sử ủng hộ
router.get('/public/:userId', [
    param('userId').isMongoId().withMessage('ID tác giả không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Số bài viết mỗi trang không hợp lệ')
], userController.getPublicAuthorProfile);

// Route sửa Profile (Cần lớp 1, 2, 3, 4) 
router.put('/profile',
    authenticateToken,
    authorizeRole('user'),
    profileUpdateLimiter, // Lớp 2
    [
        body('fullName').optional().notEmpty().withMessage('Tên không được để trống'), // Lớp 1 
        body('phone').optional({ checkFalsy: true }).isMobilePhone('vi-VN').withMessage('SĐT không hợp lệ'),
        body('bio').optional().isLength({ max: 500 }).withMessage('Bio tối đa 500 ký tự'),
        body('avatar').optional({ checkFalsy: true }).isString().withMessage('Avatar phải là chuỗi base64 hoặc URL')
            .custom((value) => {
                if (value === 'default-avatar.png' || value.startsWith('http://') || value.startsWith('https://')) {
                    return true;
                }
                if (!value.startsWith('data:image/')) {
                    throw new Error('Avatar phải là hình ảnh (JPEG, PNG, GIF, WEBP,...)');
                }
                const base64Content = value.split(',')[1];
                if (!base64Content) {
                    throw new Error('Định dạng ảnh base64 không hợp lệ');
                }
                const sizeInBytes = (base64Content.length * 0.75);
                if (sizeInBytes > 10 * 1024 * 1024) {
                    throw new Error('Ảnh đại diện không được vượt quá 10MB');
                }
                return true;
            }),
        body('bankName').optional().trim().isLength({ max: 120 }).withMessage('Tên ngân hàng tối đa 120 ký tự'),
        body('bankAccountNumber').optional().trim().matches(/^[0-9A-Za-z .-]{0,40}$/).withMessage('Số tài khoản không hợp lệ')
    ],
    userController.updateMyProfile
);

// Route đổi mật khẩu
router.put('/change-password',
    authenticateToken,
    profileUpdateLimiter,
    [
        body('oldPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
        body('newPassword')
            .isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự')
            .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa')
            .matches(/[a-z]/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường')
            .matches(/[0-9]/).withMessage('Mật khẩu phải chứa ít nhất 1 số')
    ],
    userController.changeMyPassword
);

// Route vô hiệu hóa tài khoản
router.post('/deactivate', authenticateToken, userController.deactivateAccount.bind(userController));

// Route xóa tài khoản
router.post('/delete-account', authenticateToken, userController.deleteAccount.bind(userController));

export default router;