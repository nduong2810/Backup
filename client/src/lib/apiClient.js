import axios from 'axios';

// Mặc định dùng đường dẫn tương đối /api để Vite proxy sang backend localhost:5000.
// Nhờ vậy chỉ cần public frontend bằng 1 lệnh: ngrok http 5173.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const normalizedBaseUrl = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 300000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  // Tự động set Content-Type phù hợp:
  // - FormData → để axios tự set multipart/form-data (cần boundary)
  // - Các request khác → application/json
  if (config.data instanceof FormData) {
    // Xóa Content-Type để axios/browser tự set với boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = error.config?.url || '';
      // Tránh tự động logout trên các API thuộc luồng xác thực/đăng nhập/quên mật khẩu
      if (
        !url.includes('/auth/login') &&
        !url.includes('/auth/register') &&
        !url.includes('/auth/verify-otp') &&
        !url.includes('/auth/verify-reset-otp') &&
        !url.includes('/auth/reset-password') &&
        !url.includes('/auth/forgot-password')
      ) {
        try {
          // Sử dụng dynamic import để tránh lỗi import vòng tròn (Circular Dependency)
          const { default: store } = await import('../store');
          const { logout } = await import('../store/slices/loginSlice');
          store.dispatch(logout());
        } catch (e) {
          console.error('[apiClient] Lỗi khi thực hiện tự động logout:', e);
        }
        const message = error.response.data?.message || 'Phiên đăng nhập đã hết hạn hoặc tài khoản bị khóa.';
        sessionStorage.setItem('locked_message', message);
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
