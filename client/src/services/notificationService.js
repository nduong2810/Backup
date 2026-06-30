import apiClient from '../lib/apiClient';

export const getMyNotificationsApi = (limit = 20) => apiClient.get('/notifications', { params: { limit } });
export const markNotificationReadApi = (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`);
export const markAllNotificationsReadApi = () => apiClient.patch('/notifications/read-all');
