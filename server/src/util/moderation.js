/**
 * Loại bỏ dấu tiếng Việt để chuẩn hóa so sánh.
 * Chỉ dùng cho matching từ VIẾT TẮT không dấu (dm, vcl...),
 * KHÔNG dùng cho matching cụm từ tiếng Việt (tránh false positive).
 */
const removeAccents = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

/**
 * Chuẩn hóa text thành dạng có word boundary bằng khoảng trắng.
 * Thay thế dấu câu bằng space, loại bỏ khoảng trắng thừa, thêm padding.
 */
const normalizeText = (text) => {
    return ' ' + text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'@\[\]\\|<>+]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() + ' ';
};

/**
 * Trích xuất domain từ URL (không bao gồm protocol và path).
 */
const extractDomain = (url) => {
    try {
        const match = url.match(/https?:\/\/([^\/\s?#]+)/i);
        return match ? match[1].toLowerCase() : '';
    } catch {
        return '';
    }
};

// ====================================================================
// 1. KIỂM TRA ĐỘ DÀI
// ====================================================================

export const validateLength = (text, min, max, label) => {
    const len = (text || '').trim().length;
    if (len < min) {
        throw {
            status: 400,
            message: `${label} quá ngắn, cần tối thiểu ${min} ký tự (hiện tại: ${len} ký tự).`
        };
    }
    if (len > max) {
        throw {
            status: 400,
            message: `${label} quá dài, tối đa ${max} ký tự (hiện tại: ${len} ký tự).`
        };
    }
};

// ====================================================================
// 2. PHÁT HIỆN SPAM TEXT
// ====================================================================

// Placeholder/filler text rõ ràng (KHÔNG bao gồm "test" vì đây là diễn đàn IT)
const PLACEHOLDER_PATTERNS = [
    'lorem ipsum',
    'dolor sit amet',
    'consectetur adipiscing',
];

export const detectSpamText = (text) => {
    if (!text) return null;
    const trimmed = text.trim();

    // 2a. Ký tự chữ/số lặp lại liên tiếp >= 5 lần (ví dụ: aaaaaaa, 1111111)
    // Cho phép markdown dividers (===, ---, ***) bằng cách chỉ check chữ cái + số
    const repeatCharRegex = /([a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF])\1{4,}/;
    const repeatMatch = trimmed.match(repeatCharRegex);
    if (repeatMatch) {
        return `Nội dung chứa ký tự lặp lại quá nhiều lần liên tiếp.`;
    }

    // 2b. Ký tự đặc biệt lặp >= 8 lần liên tiếp (cho phép nhiều hơn vì markdown)
    const specialRepeatMatch = trimmed.match(/([!?@#$%^&])\1{7,}/);
    if (specialRepeatMatch) {
        return `Nội dung chứa ký tự đặc biệt lặp lại quá nhiều lần.`;
    }

    // 2c. Từ đơn lặp lại liên tiếp >= 5 lần (nâng từ 4 lên 5 để giảm false positive)
    const words = trimmed.toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);

    for (let i = 0; i + 4 < words.length; i++) {
        if (words[i] === words[i + 1] && words[i] === words[i + 2] &&
            words[i] === words[i + 3] && words[i] === words[i + 4]) {
            return `Nội dung chứa từ lặp lại liên tục quá nhiều lần.`;
        }
    }

    // 2d. Cụm 2 từ lặp lại liên tiếp >= 4 lần
    for (let i = 0; i + 7 < words.length; i++) {
        if (words[i] === words[i + 2] && words[i + 1] === words[i + 3] &&
            words[i] === words[i + 4] && words[i + 1] === words[i + 5] &&
            words[i] === words[i + 6] && words[i + 1] === words[i + 7]) {
            return `Nội dung chứa cụm từ lặp lại liên tục quá nhiều lần.`;
        }
    }

    // 2e. Văn bản giữ chỗ (placeholder)
    const lower = trimmed.toLowerCase();
    for (const ph of PLACEHOLDER_PATTERNS) {
        if (lower.includes(ph)) {
            return `Vui lòng nhập nội dung thực tế thay vì văn bản mẫu.`;
        }
    }

    return null;
};

// ====================================================================
// 3. PHÁT HIỆN LINK RÁC
// ====================================================================

// Domain rút gọn link (thường dùng để che giấu link spam)
const SHORTENER_DOMAINS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
    'is.gd', 'buff.ly', 'adf.ly', 'shorte.st', 'shorturl.at',
    'rb.gy', 'cutt.ly', 'tny.im'
];

// Domain/từ khóa nhà cái cá cược cụ thể (chỉ check trên phần domain, không phải toàn bộ URL)
const BANNED_DOMAIN_KEYWORDS = [
    // Nhà cái cụ thể - đủ unique để không gây false positive
    'kubet', '1xbet', 'bet365', '188bet', '789bet',
    'w88', 'fun88', 'm88.', 'fb88', 'fi88', 'f8bet', 'hi88',
    'new88', 'ae888', 'shbet', 'jun88', 'sin88', 'typhu88',
    'bong88', 'bong99', 'lucky88', 'ok365', 'xoc88',
    'sv388', 'sbobet', 'dafabet', 'bk8.', '12bet',
    // Từ khóa cờ bạc đặc thù trong domain
    'gamebai', 'xocdia', 'taixiu', 'quayhu', 'nohu',
    'soikeo', 'keonhacai',
];

export const detectSpamLinks = (text) => {
    if (!text) return null;

    const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];

    for (const url of urlMatches) {
        const domain = extractDomain(url);
        if (!domain) continue;

        // 3a. Kiểm tra link rút gọn
        if (SHORTENER_DOMAINS.some(s => domain === s || domain.endsWith('.' + s))) {
            return `Liên kết rút gọn không được phép. Vui lòng sử dụng liên kết gốc.`;
        }

        // 3b. Kiểm tra domain cá cược/nhà cái (chỉ so sánh trên phần domain)
        if (BANNED_DOMAIN_KEYWORDS.some(kw => domain.includes(kw))) {
            return `Liên kết đến trang web không được phép.`;
        }
    }

    return null;
};

// ====================================================================
// 4. PHÁT HIỆN TỪ KHÓA CẤM
// ====================================================================

// ---- 4A. Từ thô tục TIẾNG VIỆT CÓ DẤU (word boundary matching) ----
// Chỉ match khi viết ĐÚNG DẤU → tránh false positive với từ thường
const PROFANITY_VIET_ACCENTED = [
    'đm', 'đéo', 'cặc', 'lồn', 'đệt', 'đụ', 'đĩ', 'địt', 'đỉ',
];

// ---- 4B. Viết tắt thô tục (safe - không trùng từ tiếng Việt chuẩn) ----
const PROFANITY_ABBREVIATIONS = [
    'dm', 'dkm', 'vcl', 'vkl', 'clm', 'clme', 'dmm', 'cc', 'loz', 'loz', 'lon', 'dit', 'du', 'bu cu', 'bu lon','cl', 'clm', 'clme','djt', 'djt me', 'du me',
];

// ---- 4C. Từ thô tục TIẾNG ANH (word boundary matching) ----
const PROFANITY_ENGLISH = [
    'fuck', 'shit', 'bitch', 'asshole', 'pussy', 'dick',
    'motherfucker', 'nigger', 'faggot', 'stfu', 'wtf',
];

// ---- 4D. Cụm từ vi phạm CÓ DẤU (substring matching trên bản gốc) ----
// Chỉ match khi viết ĐÚNG DẤU tiếng Việt → cực kỳ chính xác
const FORBIDDEN_PHRASES_ACCENTED = [
    // Cờ bạc, cá cược
    'cờ bạc', 'cá độ', 'lô đề', 'soi cầu', 'cá cược', 'nhà cái',
    'kèo nhà cái', 'soi kèo',
    // Nội dung người lớn
    'phim sex', 'phim 18+', 'kích dục',
    // Cụm từ thô tục
    'địt mẹ', 'đụ mẹ', 'ăn cặc', 'bú cu', 'bú lồn', 'lồn mẹ', 'đụ má',
];

// ---- 4E. Thương hiệu/tên riêng nhà cái + từ khóa KHÔNG DẤU an toàn ----
// Những cụm KHÔNG BAO GIỜ xuất hiện trong văn bản tiếng Việt hợp lệ
const FORBIDDEN_EXACT_TERMS = [
    // Tên nhà cái (brand names - unique, không trùng từ thường)
    'kubet', '1xbet', 'bet365', '188bet', '789bet',
    'w88', 'fun88', 'm88', 'fb88', 'fi88', 'f8bet', 'hi88',
    'new88', 'ae888', 'shbet', 'jun88', 'sin88', 'typhu88',
    'bong88', 'bong99', 'lucky88', 'ok365', 'xoc88',
    'sv388', 'sbobet', 'dafabet', '12bet', 'bk8',
    // Thô tục viết không dấu cố ý (substring matching - safe vì rất cụ thể)
    'dit me', 'djt me', 'du me', 'bu cu', 'bu lon',
    // Nội dung người lớn tiếng Anh
    'porn', 'hentai', 'viagra',
];

export const detectForbiddenKeywords = (text) => {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    const normalized = normalizeText(lowerText);
    const normalizedNoAccent = normalizeText(removeAccents(lowerText));

    // 4a. Kiểm tra từ thô tục tiếng Việt CÓ DẤU (word boundary matching)
    for (const word of PROFANITY_VIET_ACCENTED) {
        if (normalized.includes(' ' + word + ' ')) {
            return `Nội dung chứa từ ngữ không phù hợp với cộng đồng.`;
        }
    }

    // 4b. Kiểm tra viết tắt thô tục (word boundary trên bản không dấu)
    for (const word of PROFANITY_ABBREVIATIONS) {
        if (normalizedNoAccent.includes(' ' + word + ' ')) {
            return `Nội dung chứa từ ngữ không phù hợp với cộng đồng.`;
        }
    }

    // 4c. Kiểm tra từ thô tục tiếng Anh (word boundary matching)
    for (const word of PROFANITY_ENGLISH) {
        if (normalized.includes(' ' + word + ' ')) {
            return `Nội dung chứa từ ngữ không phù hợp với cộng đồng.`;
        }
    }

    // 4d. Kiểm tra cụm từ vi phạm CÓ DẤU (substring matching trên bản gốc có dấu)
    // → Rất chính xác vì tiếng Việt có dấu rất khó trùng nhầm
    for (const phrase of FORBIDDEN_PHRASES_ACCENTED) {
        if (lowerText.includes(phrase)) {
            return `Nội dung chứa cụm từ vi phạm chính sách cộng đồng.`;
        }
    }

    // 4e. Kiểm tra tên nhà cái + cụm thô tục không dấu an toàn (substring matching)
    // → Chỉ chứa những từ/cụm KHÔNG BAO GIỜ xuất hiện hợp lệ trong tiếng Việt
    for (const term of FORBIDDEN_EXACT_TERMS) {
        if (lowerText.includes(term)) {
            return `Nội dung chứa nội dung vi phạm chính sách cộng đồng.`;
        }
    }

    return null;
};

// ====================================================================
// 5. HÀM TỔNG HỢP KIỂM DUYỆT
// ====================================================================

/**
 * Kiểm duyệt toàn bộ bài đăng (tiêu đề + nội dung).
 * Throw error nếu vi phạm bất kỳ quy tắc nào.
 */
export const validatePost = (title, content) => {
    // 1. Kiểm tra độ dài
    validateLength(title, 10, 200, 'Tiêu đề bài viết');
    validateLength(content, 20, 10000, 'Nội dung chi tiết bài viết');

    // 2. Kiểm duyệt Tiêu đề
    let result = detectForbiddenKeywords(title);
    if (result) throw { status: 400, message: `Tiêu đề vi phạm: ${result}` };

    result = detectSpamText(title);
    if (result) throw { status: 400, message: `Tiêu đề không hợp lệ: ${result}` };

    result = detectSpamLinks(title);
    if (result) throw { status: 400, message: `Tiêu đề không được chứa liên kết.` };

    // 3. Kiểm duyệt Nội dung
    result = detectForbiddenKeywords(content);
    if (result) throw { status: 400, message: `Nội dung vi phạm: ${result}` };

    result = detectSpamText(content);
    if (result) throw { status: 400, message: `Nội dung không hợp lệ: ${result}` };

    result = detectSpamLinks(content);
    if (result) throw { status: 400, message: `Nội dung chứa liên kết không hợp lệ: ${result}` };
};

/**
 * Kiểm duyệt nội dung bình luận.
 * Throw error nếu vi phạm bất kỳ quy tắc nào.
 */
export const validateComment = (content) => {
    // 1. Kiểm tra độ dài
    validateLength(content, 2, 2000, 'Nội dung bình luận');

    // 2. Kiểm duyệt Nội dung
    let result = detectForbiddenKeywords(content);
    if (result) throw { status: 400, message: `Bình luận vi phạm: ${result}` };

    result = detectSpamText(content);
    if (result) throw { status: 400, message: `Bình luận không hợp lệ: ${result}` };

    result = detectSpamLinks(content);
    if (result) throw { status: 400, message: `Bình luận chứa liên kết không hợp lệ: ${result}` };
};
