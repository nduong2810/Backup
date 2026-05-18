import Question from '../model/question.model.js';

class QuestionRepository {
    // Lấy toàn bộ câu hỏi và nạp (populate) thêm thông tin của tác giả bài viết
    async getAllQuestions() {
        return await Question.find()
            .populate('author', 'username avatar') // Lấy username và avatar từ bảng User để Frontend hiển thị
            .sort({ createdAt: -1 }); // Bài viết mới nhất xếp lên đầu
    }
}

export default new QuestionRepository();