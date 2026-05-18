import express from 'express';
import postController from '../controller/post.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { voteLimiter } from '../middleware/rateLimit.middleware.js';
import { postIdValidation, voteValidation, relatedPostsValidation } from '../validation/post.validation.js';

const router = express.Router();

// ====================================================================
// POST ROUTES - Định tuyến cho bài viết
// ====================================================================

// GET /api/posts — Danh sách + filter (Public)
router.get('/', postController.getPosts.bind(postController));

// ==================== XEM CHI TIẾT BÀI VIẾT ====================
// GET /api/posts/related/:tag — Bài viết liên quan (Public)
// Pipeline: Validation (Lớp 1) → Controller
// ⚠️ Đặt TRƯỚC /:id để Express không nhầm "related" là postId
router.get('/related/:tag',
    relatedPostsValidation,                                     // Lớp 1: Validate tag
    postController.getRelatedPosts.bind(postController)
);

// GET /api/posts/:id — Xem chi tiết (Public, không cần đăng nhập)
// Pipeline: Validation (Lớp 1) → Controller
router.get('/:id',
    optionalAuthenticateToken,                                 // Lớp 3 (optional): decode user nếu có token
    postIdValidation,                                           // Lớp 1: Validate ObjectId
    postController.getPostDetail.bind(postController)
);

// ==================== VOTE BÀI VIẾT ====================
// POST /api/posts/:id/vote — Upvote/Downvote (Cần đăng nhập)
// Pipeline: Authentication (Lớp 3) → Rate Limiting (Lớp 2) → Validation (Lớp 1) → Controller
router.post('/:id/vote',
    authenticateToken,                                          // Lớp 3: Xác thực JWT
    voteLimiter,                                                // Lớp 2: Rate limit (30 req/phút)
    voteValidation,                                             // Lớp 1: Validate input
    postController.votePost.bind(postController)
);

export default router;
