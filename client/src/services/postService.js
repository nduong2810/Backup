import apiClient from '../lib/apiClient';

export const fetchPostsApi = (filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return apiClient.get('/posts', { params: cleanFilters });
};

export const getPostDetail = (postId) => apiClient.get(`/posts/${postId}`);
export const votePost = (postId, voteType) => apiClient.post(`/posts/${postId}/vote`, { voteType });
export const reactPost = (postId, reactionType) => apiClient.post(`/posts/${postId}/react`, { reactionType });
export const createPostComment = (postId, payload) => apiClient.post(`/posts/${postId}/comments`, payload);
export const reactPostComment = (commentId, reactionType) => apiClient.post(`/posts/comments/${commentId}/react`, { reactionType });
export const getRelatedPosts = (tag, excludePostId) => apiClient.get(`/posts/related/${tag}`, { params: { excludePostId } });
export const getPostDetailSidebarData = () => apiClient.get('/posts/sidebar');
export const getTrendingTodayPosts = (limit = 10) => apiClient.get('/posts/trending-today', { params: { limit } });
export const getTopUpvotedPosts = (limit = 10) => apiClient.get('/posts/top-upvoted', { params: { limit } });
export const getTagsApi = (params = {}) => apiClient.get('/tags', { params });

export const createReportTicketApi = (payload) => apiClient.post('/reports', payload);
export const getMyReportTicketsApi = () => apiClient.get('/reports/my');
export const retractReportApi = (ticketId) => apiClient.post(`/reports/${ticketId}/retract`);
export const getPostFlagSummaryApi = (postId) => apiClient.get(`/reports/posts/${postId}/summary`);

export const getAdminFlagsApi = (params = {}) => apiClient.get('/reports/admin/flags', { params });
export const adminUpdateFlagStatusApi = (ticketId, payload) => apiClient.patch(`/reports/${ticketId}/status`, payload);
