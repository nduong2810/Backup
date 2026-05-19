import mongoose from 'mongoose';

// ====================================================================
// POST MODEL - Schema bài viết trên IT Forum
// Hỗ trợ: nhiều ảnh (Swiper), tags, upvote/downvote, đếm lượt xem
// ====================================================================

const postSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true,
        maxLength: 200 
    },
    content: { 
        type: String, 
        required: true 
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },

    // Tags phân loại bài viết (VD: ['javascript', 'react', 'nodejs'])
    tags: [{ 
        type: String, 
        trim: true, 
        lowercase: true 
    }],

    // Mảng URL ảnh đính kèm — hỗ trợ Swiper slider ở Frontend
    images: [{ 
        type: String 
    }],

    // Lưu mảng userId đã vote → dễ toggle, đếm tổng, kiểm tra trùng
    upvotes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: []
    }],
    downvotes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: []
    }],

    // Đếm lượt xem bài viết
    viewCount: { 
        type: Number, 
        default: 0 
    },

    // Trạng thái bài viết
    status: { 
        type: String, 
        enum: ['active', 'closed', 'deleted'], 
        default: 'active' 
    },
}, { 
    timestamps: true,
    // Virtual fields: tự động tính upvoteCount, downvoteCount khi toJSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Tổng số upvote
postSchema.virtual('upvoteCount').get(function() {
    return this.upvotes ? this.upvotes.length : 0;
});

// Virtual: Tổng số downvote
postSchema.virtual('downvoteCount').get(function() {
    return this.downvotes ? this.downvotes.length : 0;
});

// Index cho tìm kiếm bài viết theo tags
postSchema.index({ tags: 1 });
// Index cho sắp xếp theo thời gian
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
