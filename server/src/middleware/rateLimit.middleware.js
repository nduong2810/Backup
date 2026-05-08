import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});