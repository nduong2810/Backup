import crypto from 'crypto';

/**
 * Upload media lên Cloudinary. Hỗ trợ 2 dạng input:
 *   1. Buffer (từ Multer) — cần truyền thêm mimeType
 *   2. Base64 data URL string (fallback cho comment cũ)
 *
 * @param {Buffer|string} input - Buffer hoặc base64 data URL
 * @param {string} [mimeType] - MIME type (bắt buộc khi input là Buffer)
 * @returns {Promise<string>} Secure URL từ Cloudinary hoặc fallback
 */
export async function uploadToCloudinary(input, mimeType) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn('Cloudinary credentials missing in .env. Storing media as base64 fallback.');
        return typeof input === 'string' ? input : '';
    }

    // Xác định buffer và mime từ input
    let buffer, mime;

    if (Buffer.isBuffer(input)) {
        buffer = input;
        mime = mimeType || 'application/octet-stream';
    } else if (typeof input === 'string' && input.startsWith('data:')) {
        const mimeMatch = input.match(/^data:([^;]+);base64,/);
        mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const base64Body = input.split(',')[1] || input;
        buffer = Buffer.from(base64Body, 'base64');
    } else {
        return input; // Đã là URL hoặc format không xác định
    }

    const isVideo = mime.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    try {
        const timestamp = Math.round(Date.now() / 1000);
        const signatureString = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

        // Dùng FormData + Blob (binary) thay vì JSON để tránh overhead base64
        const extMap = {
            'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
            'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogg', 'video/x-matroska': 'mkv',
        };
        const ext = extMap[mime] || (isVideo ? 'mp4' : 'png');
        const blob = new Blob([buffer], { type: mime });

        const formData = new FormData();
        formData.append('file', blob, `upload.${ext}`);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            { method: 'POST', body: formData }
        );

        const data = await response.json();
        if (data.secure_url) return data.secure_url;

        console.error(`Cloudinary ${resourceType} upload error:`, data);
        return typeof input === 'string' ? input : '';
    } catch (error) {
        console.error(`Error uploading ${resourceType} to Cloudinary:`, error);
        return typeof input === 'string' ? input : '';
    }
}
