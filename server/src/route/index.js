import express from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import adminRoutes from './admin.routes.js'
// ====================================================================
// ROUTE AGGREGATOR
// Gom tất cả routes — thêm route modules ở đây
// ====================================================================

const router = express.Router()

// --- Mount routes ở đây ---
// Ví dụ: router.use('/auth', authRoute)
// Ví dụ: router.use('/forum', forumRoute)

router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/admin', adminRoutes)
// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString(),
  })
})

export default router
