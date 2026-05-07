import app from './src/app'
import connectDB from './src/config/database'
import env from './src/config/environment'

// ====================================================================
// SERVER ENTRY POINT
// ====================================================================

const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB()

    // Khởi động Express server
    app.listen(env.PORT, () => {
      console.log('====================================')
      console.log(`🚀 Server đang chạy tại: http://localhost:${env.PORT}`)
      console.log(`📡 API: http://localhost:${env.PORT}/api`)
      console.log(`🔑 Health: http://localhost:${env.PORT}/api/health`)
      console.log('====================================')
    })
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error)
    process.exit(1)
  }
}

startServer()
