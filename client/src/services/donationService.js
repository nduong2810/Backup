import apiClient from '../lib/apiClient';

export const createDonationCheckoutApi = (payload) => apiClient.post('/donations', payload);
export const confirmVnpayDonationApi = (payload) => apiClient.post('/donations/gateway/vnpay/confirm', payload);
export const getPublicAuthorProfileApi = (userId) => apiClient.get(`/user/public/${userId}`);

export const fetchAdminDonationsApi = ({ status = '', paymentMethod = 'cod' } = {}) => {
  const params = new URLSearchParams();

  if (status) params.set('status', status);
  if (paymentMethod) params.set('paymentMethod', paymentMethod);

  const query = params.toString();
  return apiClient.get(`/donations/admin${query ? `?${query}` : ''}`);
};

export const approveCodDonationApi = (donationId) => {
  return apiClient.patch(`/donations/admin/${donationId}/approve`);
};
