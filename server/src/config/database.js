import mongoose from 'mongoose'
import env from './environment'

// ====================================================================
// CẤU HÌNH KẾT NỐI MONGODB
// ====================================================================
// Mặc định: Local MongoDB (mongodb://localhost:27017)
// Khi nâng cấp: Đổi MONGODB_URI trong .env sang MongoDB Atlas (Cloud)
// ====================================================================

const connectDB = async () => {
  try {
    // --- Kết nối MongoDB (Local hoặc Cloud tùy .env) ---
    const conn = await mongoose.connect(env.MONGODB_URI)

    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    console.log(`📁 Database: ${conn.connection.name}`)

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
