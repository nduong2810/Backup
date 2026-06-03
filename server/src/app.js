import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import corsOptions from './config/cors'
import routes from './route/index'

// ====================================================================
// EXPRESS APP SETUP
// Cấu hình middleware pipeline
// ====================================================================

const app = express()

// --- Global Middlewares ---
app.use(cors(corsOptions))         // CORS

// Cho phép upload media dạng base64 trong JSON body.
// Hỗ trợ upload đồng thời nhiều ảnh + video nên cần limit lớn.
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use(cookieParser())            // Parse cookies

// --- API Routes ---
app.use('/api', routes)

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại`,
  })
})

export default app
