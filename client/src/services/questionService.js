import apiClient from '../lib/apiClient';

// Hàm gọi API lấy danh sách tất cả câu hỏi
export const getAllQuestions = () => {
    // Gửi request GET tới endpoint /questions
    // Lưu ý: apiClient đã được cấu hình sẵn baseURL là '/api/v1' hoặc '/api'
    return apiClient.get('/questions');
};