import multer from 'multer';

// ====================================================================
// UPLOAD MIDDLEWARE - Xử lý file upload bằng Multer (memory storage)
// File được giữ trong RAM dưới dạng Buffer, sau đó upload lên Cloudinary
// ====================================================================

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-matroska'];

// Map extension → MIME type (dùng khi browser không gửi đúng mimetype)
const VIDEO_EXT_TO_MIME = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mkv': 'video/x-matroska',
};
const IMAGE_EXT_TO_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};

const fileFilter = (req, file, cb) => {
    const ext = (file.originalname || '').slice((file.originalname || '').lastIndexOf('.')).toLowerCase();

    if (file.fieldname === 'images') {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
        // Fallback: kiểm tra extension (browser có thể gửi mimetype sai/rỗng)
        if (IMAGE_EXT_TO_MIME[ext]) {
            file.mimetype = IMAGE_EXT_TO_MIME[ext]; // Ghi đè mimetype đúng để downstream xử lý chính xác
            return cb(null, true);
        }
        return cb(new Error('Định dạng hình ảnh không hợp lệ (chỉ nhận JPEG, PNG, GIF, WEBP).'));
    }
    if (file.fieldname === 'videos') {
        if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) return cb(null, true);
        // Fallback: kiểm tra extension (Chrome/Edge trên Windows thường gửi .mkv với mimetype rỗng)
        if (VIDEO_EXT_TO_MIME[ext]) {
            file.mimetype = VIDEO_EXT_TO_MIME[ext]; // Ghi đè mimetype đúng để Cloudinary nhận diện resource_type
            return cb(null, true);
        }
        return cb(new Error('Định dạng video không hợp lệ (chỉ nhận MP4, WEBM, OGG, MKV).'));
    }
    cb(null, false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 15,
    },
});

/**
 * Wrapper để bắt lỗi multer và trả JSON response thay vì crash
 */
const wrapMulter = (multerMiddleware) => (req, res, next) => {
    multerMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            const messages = {
                LIMIT_FILE_SIZE: 'File quá lớn (tối đa 50MB mỗi file).',
                LIMIT_FILE_COUNT: 'Quá nhiều file đính kèm.',
                LIMIT_UNEXPECTED_FILE: 'Field file không hợp lệ.',
            };
            return res.status(400).json({
                success: false,
                message: messages[err.code] || err.message,
            });
        }
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Middleware cho bài viết: tối đa 10 ảnh + 5 video
export const uploadPostMedia = wrapMulter(
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'videos', maxCount: 5 },
    ])
);

// Middleware cho bình luận: tối đa 5 ảnh + 3 video
export const uploadCommentMedia = wrapMulter(
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 3 },
    ])
);
