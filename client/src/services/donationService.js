import apiClient from '../lib/apiClient';

export const createDonationCheckoutApi = (payload) => apiClient.post('/donations', payload);
export const confirmVnpayDonationApi = (payload) => apiClient.post('/donations/gateway/vnpay/confirm', payload);
export const getPublicAuthorProfileApi = (userId) => apiClient.get(`/user/public/${userId}`);