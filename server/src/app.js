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
app.use(express.json())            // Parse JSON body
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded body
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
