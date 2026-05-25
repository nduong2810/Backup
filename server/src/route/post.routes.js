import express from 'express';
import postController from '../controller/post.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { voteLimiter } from '../middleware/rateLimit.middleware.js';
import { postIdValidation, voteValidation, relatedPostsValidation } from '../validation/post.validation.js';

const router = express.Router();

// GET /api/posts — Danh sách + filter (Public)
router.get('/', postController.getPosts.bind(postController));

// GET /api/posts/related/:tag — Bài viết liên quan (Public)
router.get('/related/:tag',
  relatedPostsValidation,
  postController.getRelatedPosts.bind(postController)
);

// GET /api/posts/sidebar — Dữ liệu cột phải cho trang chi tiết
router.get('/sidebar', postController.getPostDetailSidebar.bind(postController));

// GET /api/posts/trending-today — Top 10 lượt xem trong ngày
router.get('/trending-today', postController.getTrendingToday.bind(postController));

// GET /api/posts/top-upvoted — Top 10 lượt upvote
router.get('/top-upvoted', postController.getTopUpvoted.bind(postController));

// GET /api/posts/:id — Xem chi tiết (Public)
router.get('/:id',
  optionalAuthenticateToken,
  postIdValidation,
  postController.getPostDetail.bind(postController)
);

// POST /api/posts/:id/vote — Upvote/Downvote (Cần đăng nhập)
router.post('/:id/vote',
  authenticateToken,
  voteLimiter,
  voteValidation,
  postController.votePost.bind(postController)
);

export default router;
