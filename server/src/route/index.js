import express from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import adminRoutes from './admin.routes.js'
import postRoutes from './post.routes.js'

const router = express.Router()

// --- Mount routes ở đây ---
router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/admin', adminRoutes)
router.use('/posts', postRoutes)

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString(),
  })
})

export default router
