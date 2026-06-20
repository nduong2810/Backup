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
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Tự động set Content-Type phù hợp:
  // - FormData → để axios tự set multipart/form-data (cần boundary)
  // - Các request khác → application/json
  if (config.data instanceof FormData) {
    // Xóa Content-Type để axios/browser tự set với boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

export default apiClient;
