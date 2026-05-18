import questionService from '../service/question.service.js';

class QuestionController {
    getAllQuestions = async (req, res) => {
        const result = await questionService.fetchAllQuestions();

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Trả về dữ liệu thành công kèm mã HTTP 200
        return res.status(200).json(result);
    }
}

export default new QuestionController();