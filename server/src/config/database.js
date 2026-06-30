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

    // Cập nhật các bài viết/bình luận của user bị inactive thành isAuthorActive = false
    await Post.updateMany(
      { author: { $in: inactiveUserIds }, isAuthorActive: { $ne: false } },
      { $set: { isAuthorActive: false } }
    );
    await Comment.updateMany(
      { author: { $in: inactiveUserIds }, isAuthorActive: { $ne: false } },
      { $set: { isAuthorActive: false } }
    );

    // Cập nhật các bài viết/bình luận còn lại thành isAuthorActive = true
    await Post.updateMany(
      { author: { $nin: inactiveUserIds }, isAuthorActive: { $ne: true } },
      { $set: { isAuthorActive: true } }
    );
    await Comment.updateMany(
      { author: { $nin: inactiveUserIds }, isAuthorActive: { $ne: true } },
      { $set: { isAuthorActive: true } }
    );
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ trạng thái hoạt động của tác giả:', error);
  }
};

const connectDB = async () => {
  try {
    // --- Kết nối MongoDB (Local hoặc Cloud tùy .env) ---
    let conn
    try {
      conn = await mongoose.connect(env.MONGODB_URI)
    } catch (error) {
      if (error.message && (error.message.includes('querySrv ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        console.warn('⚠️ Lỗi phân giải DNS cho MongoDB Atlas. Đang thử lại với DNS của Google/Cloudflare...')
        const dns = await import('dns')
        dns.setServers(['8.8.8.8', '1.1.1.1'])
        conn = await mongoose.connect(env.MONGODB_URI)
      } else {
        throw error
      }
    }

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
