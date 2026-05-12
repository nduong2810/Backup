import apiClient from '../lib/apiClient';

export const requestResetOtp = (email) =>
  apiClient.post('/api/auth/forgot-password', { email });

export const verifyResetOtp = (email, otp) =>
  apiClient.post('/api/auth/verify-reset-otp', { email, otp });

export const resetPassword = (email, resetToken, newPassword, confirmPassword) =>
  apiClient.post('/api/auth/reset-password', {
    email,
    resetToken,
    newPassword,
    confirmPassword,
  });


export const registerUser = (userData) =>
    apiClient.post('/api/auth/register', userData);

export const verifyRegisterOtp = (email, otp) =>
    apiClient.post('/api/auth/verify-otp', { email, otp });
