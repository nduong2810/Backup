import apiClient from '../lib/apiClient';

export const fetchPostsApi = (filters = {}) => {
  // Loại bỏ các key có giá trị rỗng trước khi gửi để URL gọn hơn
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return apiClient.get('/posts', { params: cleanFilters });
};
