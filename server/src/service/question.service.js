import questionRepository from '../repository/question.repository.js';

class QuestionService {
    async fetchAllQuestions() {
        try {
            const questions = await questionRepository.getAllQuestions();
            return {
                success: true,
                data: questions
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi xử lý dữ liệu câu hỏi: ' + error.message
            };
        }
    }
}

export default new QuestionService();