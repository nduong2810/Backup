import apiClient from '../lib/apiClient';

export const getMyProfile = () => apiClient.get('/user/profile');

export const updateMyProfile = (payload) =>
  apiClient.put('/user/profile', payload);

export const getMyStatistics = (months = 12) =>
  apiClient.get('/user/statistics', { params: { months } });

export const getAdminProfile = () => apiClient.get('/admin/profile');

export const getAdminDashboardStats = () => apiClient.get('/admin/dashboard-stats');

export const getAdminSystemSettings = () => apiClient.get('/admin/settings');

export const updateAdminSystemSetting = (payload) => apiClient.put('/admin/settings', payload);

export const getAdminPosts = ({ page = 1, limit = 10, keyword = '', status = 'all' } = {}) =>
  apiClient.get('/admin/posts', {
    params: { page, limit, keyword, status },
  });

export const updateAdminPostStatus = (postId, status) =>
  apiClient.patch(`/admin/posts/${postId}/status`, { status });

export const adminCreateTag = (payload) => apiClient.post('/admin/tags', payload);

export const adminUpdateTag = (tagId, payload) => apiClient.put(`/admin/tags/${tagId}`, payload);

export const adminDeleteTag = (tagId) => apiClient.delete(`/admin/tags/${tagId}`);
