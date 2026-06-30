import apiClient from '../lib/apiClient';

export const requestResetOtp = (email) =>
  apiClient.post('/auth/forgot-password', { email });

export const verifyResetOtp = (email, otp) =>
  apiClient.post('/auth/verify-reset-otp', { email, otp });

export const resetPassword = (email, resetToken, newPassword, confirmPassword) =>
  apiClient.post('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
    confirmPassword,
  });

export const registerUser = (userData) =>
  apiClient.post('/auth/register', userData);

export const verifyRegisterOtp = (email, otp) =>
  apiClient.post('/auth/verify-otp', { email, otp });

export const resendRegisterOtp = (email) =>
  apiClient.post('/auth/resend-otp', { email });

export const loginUser = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const logoutUser = () =>
  apiClient.post('/auth/logout');

export const requestReactivateOtpApi = (email) =>
  apiClient.post('/auth/request-reactivate-otp', { email });

export const verifyReactivateOtpApi = (email, otp) =>
  apiClient.post('/auth/reactivate-otp', { email, otp });

export const requestCancelDeletionOtpApi = (email) =>
  apiClient.post('/auth/request-cancel-deletion-otp', { email });

export const verifyCancelDeletionOtpApi = (email, otp) =>
  apiClient.post('/auth/cancel-deletion-otp', { email, otp });
