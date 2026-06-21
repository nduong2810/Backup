/**
 * Generate a clean, URL-friendly slug from a string.
 * Strips Vietnamese diacritics, maps special cases, and replaces non-alphanumeric chars with hyphens.
 */
export const slugify = (str) => {
    if (!str) return '';
    
    // Convert to lowercase and trim
    let slug = String(str).toLowerCase().trim();

    // Map Vietnamese diacritics to standard characters
    const mapping = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd',
    };

    // Replace characters based on mapping
    slug = slug.split('').map(char => mapping[char] || char).join('');

    // Handle common technology/programming tags
    slug = slug.replace(/c\+\+/g, 'cpp');
    slug = slug.replace(/c#/g, 'csharp');
    slug = slug.replace(/\.net/g, 'dotnet');

    // Replace non-alphanumeric characters with hyphens
    slug = slug.replace(/[^a-z0-9\s-]/g, '');

    // Replace multiple spaces/hyphens with a single hyphen
    slug = slug.replace(/[\s-]+/g, '-');

    // Trim leading/trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
};
