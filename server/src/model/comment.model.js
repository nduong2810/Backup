import mongoose from 'mongoose';

// ====================================================================
// COMMENT MODEL - Schema bình luận bài viết
// Hỗ trợ nested reply qua field parentComment
// ====================================================================

const commentSchema = new mongoose.Schema({
    content: { 
        type: String, 
        required: true, 
        maxLength: 2000 
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    post: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post', 
        required: true, 
        index: true  // Index để truy vấn nhanh comment theo bài viết
    },
    // Hỗ trợ Reply: nếu null → comment gốc, nếu có → reply cho comment đó
    parentComment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null 
    },
}, { 
    timestamps: true 
});

// Index compound cho truy vấn comment theo bài viết + thời gian
commentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
