import apiClient from '../lib/apiClient';

export const getMyProfile = () => apiClient.get('/user/profile');

export const updateMyProfile = (payload) =>
  apiClient.put('/user/profile', payload);

export const getMyStatistics = (months = 12) =>
  apiClient.get('/user/statistics', { params: { months } });

export const searchAuthorsApi = (q, limit = 8) =>
  apiClient.get('/user/search-authors', { params: { q, limit } });

export const getAdminProfile = () => apiClient.get('/admin/profile');

export const getAdminDashboardStats = () => apiClient.get('/admin/dashboard-stats');

export const getAdminAuditLogs = ({
  page = 1,
  limit = 20,
  keyword = '',
  action = '',
  targetType = '',
  fromDate = '',
  toDate = '',
} = {}) => apiClient.get('/admin/audit-logs', {
  params: { page, limit, keyword, action, targetType, fromDate, toDate },
});


export const getAdminSystemSettings = () => apiClient.get('/admin/settings');

export const updateAdminSystemSetting = (payload) => apiClient.put('/admin/settings', payload);


export const getAdminPosts = ({ page = 1, limit = 10, keyword = '', status = 'all' } = {}) =>
  apiClient.get('/admin/posts', {
    params: { page, limit, keyword, status },
  });

export const updateAdminPostStatus = (postId, status, reason = '') => {
  const cleanReason = String(reason || '').trim();
  if (['resolved', 'unresolved'].includes(status) && cleanReason) {
    return apiClient.patch(`/posts/${postId}/visibility`, { status, reason: cleanReason });
  }

  return apiClient.patch(`/admin/posts/${postId}/status`, { status, reason: cleanReason });
};


export const adminCreateTag = (payload) => apiClient.post('/admin/tags', payload);

export const adminUpdateTag = (tagId, payload) => apiClient.put(`/admin/tags/${tagId}`, payload);

export const adminDeleteTag = (tagId) => apiClient.delete(`/admin/tags/${tagId}`);

// ==================== ADMIN USER MANAGEMENT ====================
export const getAdminUsers = ({ page = 1, limit = 10, keyword = '', status = 'all' } = {}) =>
  apiClient.get('/admin/users', {
    params: { page, limit, keyword, status },
  });

export const getAdminUserDetail = (userId) => apiClient.get(`/admin/users/${userId}`);

export const toggleAdminUserStatus = (userId, isActive, reason = '') =>
  apiClient.patch(`/admin/users/${userId}/status`, { isActive, reason });

export const getAdminAllDonations = ({
  page = 1,
  limit = 10,
  keyword = '',
  status = '',
  paymentMethod = '',
  fromDate = '',
  toDate = '',
} = {}) =>
  apiClient.get('/donations/admin/all', {
    params: { page, limit, keyword, status, paymentMethod, fromDate, toDate },
  });

export const deactivateMyAccount = () =>
  apiClient.post('/user/deactivate');

export const deleteMyAccount = () =>
  apiClient.post('/user/delete-account');