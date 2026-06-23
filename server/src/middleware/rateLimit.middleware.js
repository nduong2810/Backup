import rateLimit from 'express-rate-limit';

// 1. Giới hạn đăng nhập (Login) - Bảo vệ khỏi Brute-Force
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 15,                  // Tối đa 15 lần đăng nhập/15 phút
    message: { message: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Giới hạn đăng ký tài khoản (Register) - Tránh tạo tài khoản rác hàng loạt
export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,                  // Tối đa 10 lần đăng ký/15 phút
    message: { message: "Quá nhiều yêu cầu đăng ký từ IP của bạn. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Giới hạn xác thực & gửi lại mã OTP (OTP)
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 15,                  // Tối đa 15 lần yêu cầu hoặc xác thực OTP/15 phút
    message: { message: "Quá nhiều yêu cầu gửi hoặc xác thực mã OTP. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. Giới hạn đặt lại mật khẩu (Password Reset)
export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,                  // Tối đa 10 lần yêu cầu khôi phục/đặt lại mật khẩu/15 phút
    message: { message: "Quá nhiều yêu cầu khôi phục mật khẩu. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 5. Giới hạn cập nhật thông tin cá nhân & đổi mật khẩu (Profile & Password Change)
export const profileUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 30,                  // Tối đa 30 lần cập nhật/15 phút (thoải mái cho người dùng thao tác)
    message: { message: "Bạn đang thực hiện thay đổi thông tin quá nhanh. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 6. Giới hạn Vote (Upvote/Downvote) - Nới lỏng nhẹ để trải nghiệm đọc tốt hơn
export const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 phút
    max: 60,                    // Tối đa 60 lần vote/phút
    message: { message: "Bạn đang vote quá nhanh, vui lòng chờ." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 7. Giới hạn tạo bài đăng mới (Post Creation) - Tránh spam bài đăng & quá tải upload media
export const postCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,                  // Tối đa 10 bài đăng/15 phút
    message: { message: "Bạn đang tạo bài viết quá nhanh. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 8. Giới hạn cập nhật bài đăng (Post Update) - Tránh spam sửa bài & upload media liên tục
export const postUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 30,                  // Tối đa 30 lần cập nhật/15 phút
    message: { message: "Bạn đang cập nhật bài viết quá nhanh. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 9. Giới hạn bình luận (Comment Creation) - Tránh spam bình luận & upload media trong comment
export const commentCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 30,                  // Tối đa 30 bình luận/15 phút
    message: { message: "Bạn đang bình luận quá nhanh, vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false
});

// 9a. Giới hạn xóa bài đăng (Post Deletion) - Tránh spam xóa bài & khôi phục liên tục
export const postDeletionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20,                  // Tối đa 20 lần xóa/khôi phục bài/15 phút
    message: { message: "Bạn đang xóa/khôi phục bài viết quá nhanh. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false
});

// 9b. Giới hạn xóa bình luận (Comment Deletion) - Tránh spam xóa bình luận
export const commentDeletionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 30,                  // Tối đa 30 lần xóa bình luận/15 phút
    message: { message: "Bạn đang xóa bình luận quá nhanh. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false
});

// 11. Giới hạn tạo giao dịch ủng hộ
// Nới giới hạn để quá trình test chuyển khoản thủ công không bị lúc được lúc không do rate limit.
// Các request lỗi validation/network không bị tính vào giới hạn.
export const donationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skipFailedRequests: true,
    message: { message: "Bạn đã tạo quá nhiều yêu cầu ủng hộ. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false
});

// 12. Giới hạn gửi báo cáo (Report/Ticket Creation) - Tránh spam gửi ticket
export const reportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,                  // Tối đa 10 báo cáo/15 phút
    message: { message: "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 12. Giới hạn chung toàn hệ thống (Global API Rate Limiter) - Bảo vệ DDoS & Scraping
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 150,                // Tối đa 150 yêu cầu/phút
    message: { message: "Quá nhiều yêu cầu từ thiết bị của bạn. Vui lòng thử lại sau ít phút." },
    skip: (req) => {
        // Bỏ qua rate limit cho IPN/Callback từ VNPay và API Health check để tránh bị chặn nhầm
        return req.originalUrl.startsWith('/api/donations/gateway/vnpay/confirm') || 
               req.originalUrl.startsWith('/api/health');
    },
    standardHeaders: true,
    legacyHeaders: false,
});
