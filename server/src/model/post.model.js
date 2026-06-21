import mongoose from 'mongoose';

// ====================================================================
// POST MODEL - Schema bài viết trên IT Forum
// Hỗ trợ: nhiều ảnh (Swiper), tags, upvote/downvote, like/dislike, đếm lượt xem
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

    // Upvote/downvote: dùng cho điểm/xếp hạng bài viết
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

    // Like/dislike: phản ứng riêng, không trộn với upvote/downvote
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],

    // Đếm lượt xem bài viết
    viewCount: { 
        type: Number, 
        default: 0 
    },

    // Lượt xem trong ngày (reset khi sang ngày mới)
    dailyViewCount: {
        type: Number,
        default: 0
    },
    dailyViewDate: {
        type: Date,
        default: null
    },

    // Upvote/Downvote trong ngày (reset khi sang ngày mới)
    dailyUpvoteCount: {
        type: Number,
        default: 0
    },
    dailyUpvoteDate: {
        type: Date,
        default: null
    },
    dailyDownvoteCount: {
        type: Number,
        default: 0
    },
    dailyDownvoteDate: {
        type: Date,
        default: null
    },

    // Loại bài viết: 'question' (Hỏi đáp) hoặc 'advice' (Lời khuyên/Chia sẻ kiến thức)
    postType: {
        type: String,
        enum: ['question', 'advice'],
        default: 'question',
        index: true
    },

    // URL video đính kèm (nếu có)
    videos: [{
        type: String
    }],

    // Trạng thái bài viết
    // unresolved: đang hiển thị, chưa giải quyết
    // resolved: đã khóa, vẫn hiển thị nhưng không cho tương tác
    // hidden: đang bị ẩn khỏi trang public
    // deleted: đã bị xóa mềm
    status: { 
        type: String, 
        enum: ['unresolved', 'resolved', 'hidden', 'deleted'], 
        default: 'unresolved' 
    },
    deletedAt: {
        type: Date,
        default: null,
        index: { expires: '7d' }
    },
    deletedBy: {
        type: String,
        enum: ['owner', 'report', 'admin'],
        default: null
    },
}, { 
    timestamps: true,
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

// Virtual: Tổng số like
postSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual: Tổng số dislike
postSchema.virtual('dislikeCount').get(function() {
    return this.dislikes ? this.dislikes.length : 0;
});

// Index cho tìm kiếm bài viết theo tags
postSchema.index({ tags: 1 });
// Index cho sắp xếp theo thời gian
postSchema.index({ createdAt: -1 });
// Index cho truy vấn trending trong ngày
postSchema.index({ dailyViewDate: -1, dailyViewCount: -1 });
// Index cho truy vấn top upvote trong ngày
postSchema.index({ dailyUpvoteDate: -1, dailyUpvoteCount: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
