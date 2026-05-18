import apiClient from '../lib/apiClient';

// ====================================================================
// POST SERVICE — Gọi API cho bài viết
// Pattern: giống authService.js, userService.js
// ====================================================================

// API 1: Lấy danh sách bài viết + filter
export const fetchPostsApi = (filters = {}) => {
  // Loại bỏ các key có giá trị rỗng trước khi gửi để URL gọn hơn
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return apiClient.get('/posts', { params: cleanFilters });
};

// API 2: Lấy chi tiết bài viết kèm bình luận
export const getPostDetail = (postId) =>
  apiClient.get(`/posts/${postId}`);

// API 3: Vote bài viết (Upvote / Downvote)
export const votePost = (postId, voteType) =>
  apiClient.post(`/posts/${postId}/vote`, { voteType });

// API 4: Lấy bài viết liên quan cùng tag
export const getRelatedPosts = (tag, excludePostId) =>
  apiClient.get(`/posts/related/${tag}`, { params: { excludePostId } });
