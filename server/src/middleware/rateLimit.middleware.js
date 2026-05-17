import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter riêng cho Vote — nới lỏng hơn vì vote là hành động thường xuyên
export const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 phút
    max: 30,                    // Tối đa 30 lần vote/phút
    message: { message: "Bạn đang vote quá nhanh, vui lòng chờ." },
    standardHeaders: true,
    legacyHeaders: false,
});