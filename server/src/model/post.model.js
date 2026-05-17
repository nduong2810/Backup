import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề không được để trống'],
      trim: true,
      maxlength: [300, 'Tiêu đề không được quá 300 ký tự'],
    },

    content: {
      type: String,
      required: [true, 'Nội dung không được để trống'],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Tags để lọc theo chủ đề (react, nodejs, python, ...)
    tags: {
      type: [String],
      default: [],
    },

    // Trạng thái bài viết: đã có câu trả lời hay chưa
    status: {
      type: String,
      enum: ['resolved', 'unresolved'],
      default: 'unresolved',
    },

    // Thống kê
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Số lượng câu trả lời
    answerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // tự tạo createdAt, updatedAt
  }
)

// Text index để hỗ trợ tìm kiếm full-text theo title và content
postSchema.index({ title: 'text', content: 'text' })

// Index cho các trường thường filter
postSchema.index({ tags: 1 })
postSchema.index({ status: 1 })
postSchema.index({ views: -1 })
postSchema.index({ upvotes: -1 })
postSchema.index({ createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post
