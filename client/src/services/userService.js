import apiClient from '../lib/apiClient';

export const getMyProfile = () => apiClient.get('/api/user/profile');

export const updateMyProfile = (payload) =>
  apiClient.put('/api/user/profile', payload);

