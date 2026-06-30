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
 * Wrapper để bắt lỗi multer và trả JSON response thay vì crash, đồng thời kiểm tra tổng số lượng và dung lượng file đính kèm sớm
 */
const wrapMulter = (multerMiddleware, limits = {}) => (req, res, next) => {
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

        const maxImages = limits.maxImages || 10;
        const maxVideos = limits.maxVideos || 5;
        const maxTotalSizeMB = limits.maxTotalSizeMB || 50;

        let totalImagesCount = 0;
        let totalVideosCount = 0;
        let totalBytes = 0;

        // 1. Kiểm tra files từ multer
        if (req.files) {
            if (req.files.images) {
                totalImagesCount += req.files.images.length;
                for (const f of req.files.images) {
                    totalBytes += f.size;
                }
            }
            if (req.files.videos) {
                totalVideosCount += req.files.videos.length;
                for (const f of req.files.videos) {
                    totalBytes += f.size;
                }
            }
        }

        // 2. Kiểm tra base64 từ req.body (nếu có gửi kèm)
        if (req.body.images) {
            let reqImages = [];
            if (Array.isArray(req.body.images)) {
                reqImages = req.body.images;
            } else if (typeof req.body.images === 'string') {
                try {
                    const parsed = JSON.parse(req.body.images);
                    if (Array.isArray(parsed)) reqImages = parsed;
                    else reqImages = [req.body.images];
                } catch {
                    reqImages = [req.body.images];
                }
            }
            const base64Images = reqImages.filter(img => typeof img === 'string' && img.startsWith('data:'));
            totalImagesCount += base64Images.length;
            for (const img of base64Images) {
                const body = img.split(',')[1] || img;
                totalBytes += body.length * 0.75;
            }
        }

        if (req.body.videos) {
            let reqVideos = [];
            if (Array.isArray(req.body.videos)) {
                reqVideos = req.body.videos;
            } else if (typeof req.body.videos === 'string') {
                try {
                    const parsed = JSON.parse(req.body.videos);
                    if (Array.isArray(parsed)) reqVideos = parsed;
                    else reqVideos = [req.body.videos];
                } catch {
                    reqVideos = [req.body.videos];
                }
            }
            const base64Videos = reqVideos.filter(vid => typeof vid === 'string' && vid.startsWith('data:'));
            totalVideosCount += base64Videos.length;
            for (const vid of base64Videos) {
                const body = vid.split(',')[1] || vid;
                totalBytes += body.length * 0.75;
            }
        }

        if (req.body.video && typeof req.body.video === 'string' && req.body.video.startsWith('data:')) {
            totalVideosCount += 1;
            const body = req.body.video.split(',')[1] || req.body.video;
            totalBytes += body.length * 0.75;
        }

        // 3. Kiểm tra số lượng
        if (totalImagesCount > maxImages) {
            return res.status(400).json({
                success: false,
                message: `Số lượng hình ảnh đính kèm vượt quá giới hạn cho phép (Tối đa: ${maxImages} hình ảnh).`
            });
        }

        if (totalVideosCount > maxVideos) {
            return res.status(400).json({
                success: false,
                message: `Số lượng video đính kèm vượt quá giới hạn cho phép (Tối đa: ${maxVideos} video).`
            });
        }

        // 4. Kiểm tra dung lượng
        const totalMB = totalBytes / (1024 * 1024);
        if (totalMB > maxTotalSizeMB) {
            return res.status(400).json({
                success: false,
                message: `Tổng dung lượng của tất cả hình ảnh và video đính kèm vượt quá giới hạn cho phép ${maxTotalSizeMB}MB (Hiện tại: ${totalMB.toFixed(2)}MB).`
            });
        }

        next();
    });
};

// Middleware cho bài viết: tối đa 10 ảnh + 5 video
export const uploadPostMedia = wrapMulter(
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'videos', maxCount: 5 },
    ]),
    { maxImages: 10, maxVideos: 5, maxTotalSizeMB: 50 }
);

// Middleware cho bình luận: tối đa 5 ảnh + 3 video
export const uploadCommentMedia = wrapMulter(
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 3 },
    ]),
    { maxImages: 5, maxVideos: 3, maxTotalSizeMB: 50 }
);
