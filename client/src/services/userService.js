import apiClient from '../lib/apiClient';

export const getMyProfile = () => apiClient.get('/user/profile');

export const updateMyProfile = (payload) =>
  apiClient.put('/user/profile', payload);

export const getMyStatistics = (months = 12) =>
  apiClient.get('/user/statistics', { params: { months } });

export const getAdminProfile = () => apiClient.get('/admin/profile');
