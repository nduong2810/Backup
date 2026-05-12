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

export const loginUser = (email, password) =>
  apiClient.post('/auth/login', { email, password });
