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
