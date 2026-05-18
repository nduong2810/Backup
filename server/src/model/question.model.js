import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    summary: { type: String, required: true }, // Mô tả ngắn hiển thị ở trang Home
    content: { type: String, required: true }, // Nội dung chi tiết bài viết
    tags: [{ type: String }],                  // Mảng chứa các thẻ (tag) ví dụ: ['react', 'nodejs']
    votes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    answers: [{
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Liên kết tới bảng User
}, { timestamps: true }); // Tự động tạo trường createdAt và updatedAt

export default mongoose.model('Question', questionSchema);