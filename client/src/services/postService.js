import apiClient from '../lib/apiClient';

// ====================================================================
// POST SERVICE — Gọi API cho bài viết (Post Detail)
// Pattern: giống authService.js, userService.js
// ====================================================================

// API 1: Lấy chi tiết bài viết kèm bình luận
export const getPostDetail = (postId) =>
  apiClient.get(`/posts/${postId}`);

// API 2: Vote bài viết (Upvote / Downvote)
export const votePost = (postId, voteType) =>
  apiClient.post(`/posts/${postId}/vote`, { voteType });

// API 3: Lấy bài viết liên quan cùng tag
export const getRelatedPosts = (tag, excludePostId) =>
  apiClient.get(`/posts/related/${tag}`, { params: { excludePostId } });
