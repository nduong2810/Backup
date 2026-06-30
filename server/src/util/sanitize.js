/**
 * Tiện ích làm sạch dữ liệu đầu vào để chống tấn công XSS
 */

/**
 * Loại bỏ hoàn toàn tất cả các thẻ HTML khỏi văn bản (dùng cho Bio, Họ tên, SĐT, Tiêu đề bài viết...)
 * @param {string} text 
 * @returns {string}
 */
export const stripHtmlTags = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Loại bỏ các thẻ script độc hại, event handler inline (onload, onerror...) và javascript: URI
 * nhưng vẫn giữ nguyên dấu ngoặc nhọn `< >` để tránh làm hỏng các khối code của diễn đàn IT.
 * @param {string} text 
 * @returns {string}
 */
export const sanitizeHtml = (text) => {
    if (typeof text !== 'string') return '';
    
    let sanitized = text;

    // 1. Loại bỏ các cặp thẻ <script>...</script> và nội dung bên trong
    sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

    // 2. Loại bỏ các thẻ <script ... /> tự đóng hoặc không khớp
    sanitized = sanitized.replace(/<script\b[^>]*\/?>/gi, '');

    // 3. Loại bỏ thuộc tính event handlers dạng onXXX (ví dụ: onload, onerror, onclick) bên trong các thẻ giả định hoặc thực tế
    // Tìm các chuỗi kiểu <tag ... onxxx=... >
    // Regex này tìm các thẻ HTML và loại bỏ các thuộc tính bắt đầu bằng "on"
    sanitized = sanitized.replace(/(<[^>]+)\b(on\w+)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+(?=\s|>))/gi, '$1');

    // 4. Loại bỏ các javascript:, vbscript:, data: URIs trong href, src, action
    sanitized = sanitized.replace(/\b(href|src|action)\s*=\s*(?:'[^']*?\b(?:javascript|vbscript|data)\s*:[\s\S]*?'|"[^"]*?\b(?:javascript|vbscript|data)\s*:[\s\S]*?"|(?:javascript|vbscript|data)\s*:[^\s>]+)/gi, '');

    return sanitized.trim();
};
