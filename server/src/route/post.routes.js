import express from 'express';
import postController from '../controller/post.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { uploadPostMedia, uploadCommentMedia } from '../middleware/upload.middleware.js';
import { voteLimiter } from '../middleware/rateLimit.middleware.js';
import {
  postIdValidation,
  voteValidation,
  postReactionValidation,
  relatedPostsValidation,
  createCommentValidation,
  commentReactionValidation,
  createPostValidation,
} from '../validation/post.validation.js';

const router = express.Router();

// GET /api/posts — Danh sách + filter (Public, nếu có token thì trả thêm userVote/userReaction)
router.get('/', optionalAuthenticateToken, postController.getPosts.bind(postController));

// POST /api/posts — Tạo bài đăng mới (Yêu cầu đăng nhập, multer xử lý file, validation)
router.post('/',
  authenticateToken,
  uploadPostMedia,
  createPostValidation,
  postController.createPost.bind(postController)
);

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

// POST /api/posts/:id/comments — Thêm bình luận trong chi tiết bài viết
router.post('/:id/comments',
  authenticateToken,
  uploadCommentMedia,
  createCommentValidation,
  postController.createComment.bind(postController)
);

// POST /api/posts/comments/:commentId/react — Like/Dislike bình luận
router.post('/comments/:commentId/react',
  authenticateToken,
  commentReactionValidation,
  postController.reactComment.bind(postController)
);

// POST /api/posts/:id/react — Like/Dislike bài viết, tách riêng với upvote/downvote
router.post('/:id/react',
  authenticateToken,
  postReactionValidation,
  postController.reactPost.bind(postController)
);

// POST /api/posts/:id/vote — Upvote/Downvote bài viết
router.post('/:id/vote',
  authenticateToken,
  voteLimiter,
  voteValidation,
  postController.votePost.bind(postController)
);

export default router;