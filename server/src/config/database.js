import mongoose from 'mongoose'
import env from './environment'
import { seedSystemSettings } from '../util/seedSettings.js'
import User from '../model/user.model.js'
import Post from '../model/post.model.js'
import Comment from '../model/comment.model.js'

// ====================================================================
// CẤU HÌNH KẾT NỐI MONGODB
// ====================================================================
// Mặc định: Local MongoDB (mongodb://localhost:27017)
// Khi nâng cấp: Đổi MONGODB_URI trong .env sang MongoDB Atlas (Cloud)
// ====================================================================

const syncAuthorActiveStatus = async () => {
  try {
    // Tìm tất cả user bị inactive
    const inactiveUsers = await User.find({ isActive: false }).select('_id');
    const inactiveUserIds = inactiveUsers.map(u => u._id);

    console.log(`[Sync] Đang đồng bộ trạng thái hoạt động cho tác giả. Tìm thấy ${inactiveUserIds.length} người dùng inactive.`);

    // Cập nhật các bài viết/bình luận của user bị inactive thành isAuthorActive = false
    const postInactiveResult = await Post.updateMany(
      { author: { $in: inactiveUserIds }, isAuthorActive: { $ne: false } },
      { $set: { isAuthorActive: false } }
    );
    const commentInactiveResult = await Comment.updateMany(
      { author: { $in: inactiveUserIds }, isAuthorActive: { $ne: false } },
      { $set: { isAuthorActive: false } }
    );

    // Cập nhật các bài viết/bình luận còn lại thành isAuthorActive = true
    const postActiveResult = await Post.updateMany(
      { author: { $nin: inactiveUserIds }, isAuthorActive: { $ne: true } },
      { $set: { isAuthorActive: true } }
    );
    const commentActiveResult = await Comment.updateMany(
      { author: { $nin: inactiveUserIds }, isAuthorActive: { $ne: true } },
      { $set: { isAuthorActive: true } }
    );

    console.log(`[Sync] Đồng bộ hoàn tất:`);
    console.log(`   - Bài viết: Inactive: ${postInactiveResult.modifiedCount}, Active: ${postActiveResult.modifiedCount}`);
    console.log(`   - Bình luận: Inactive: ${commentInactiveResult.modifiedCount}, Active: ${commentActiveResult.modifiedCount}`);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ trạng thái hoạt động của tác giả:', error);
  }
};

const connectDB = async () => {
  try {
    // --- Kết nối MongoDB (Local hoặc Cloud tùy .env) ---
    const conn = await mongoose.connect(env.MONGODB_URI)

    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    console.log(`📁 Database: ${conn.connection.name}`)

    // Tự động seed cấu hình hệ thống
    await seedSystemSettings()

    // Đồng bộ trạng thái isAuthorActive cho bài viết và bình luận
    await syncAuthorActiveStatus()

    // --- Xử lý sự kiện kết nối ---
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
    })

    return conn
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1) // Dừng server nếu không kết nối được DB
  }
}

export default connectDB
