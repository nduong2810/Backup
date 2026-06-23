import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import corsOptions from './config/cors'
import routes from './route/index'
import { globalLimiter } from './middleware/rateLimit.middleware.js'

// ====================================================================
// EXPRESS APP SETUP
// Cấu hình middleware pipeline
// ====================================================================

const app = express()

// Hỗ trợ rate limiting hoạt động chính xác khi triển khai sau proxy ngược (Nginx, Cloudflare, Heroku, v.v.)
app.set('trust proxy', 1)

// --- Global Middlewares ---
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(cors(corsOptions))         // CORS

// Cho phép upload media dạng base64 trong JSON body.
// Hỗ trợ upload đồng thời nhiều ảnh + video nên cần limit lớn.
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use(cookieParser())            // Parse cookies

// --- API Routes ---
// Áp dụng Global Rate Limiting để bảo vệ hệ thống trước DDoS/Scraping
app.use('/api', globalLimiter)
app.use('/api', routes)

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại`,
  })
})

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler] Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
  
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    success: false,
    message,
    errors: err.errors || undefined
  });
});

export default app
