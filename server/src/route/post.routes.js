import express from 'express';
import postController from '../controller/post.controller.js';
import postStatusController from '../controller/postStatus.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { uploadPostMedia, uploadCommentMedia } from '../middleware/upload.middleware.js';
import { voteLimiter, postCreationLimiter, postUpdateLimiter, commentCreationLimiter, postDeletionLimiter, commentDeletionLimiter } from '../middleware/rateLimit.middleware.js';
import {
  postIdValidation,
  voteValidation,
  postReactionValidation,
  relatedPostsValidation,
  createCommentValidation,
  commentReactionValidation,
  createPostValidation,
  updatePostValidation,
  updateCommentValidation,
} from '../validation/post.validation.js';

const router = express.Router();

// GET /api/posts — Danh sách + filter (Public, nếu có token thì trả thêm userVote/userReaction)
router.get('/', optionalAuthenticateToken, postController.getPosts.bind(postController));

// POST /api/posts — Tạo bài đăng mới (Yêu cầu đăng nhập, multer xử lý file, validation)
router.post('/',
  authenticateToken,
  postCreationLimiter,
  uploadPostMedia,
  createPostValidation,
  postController.createPost.bind(postController)
);

// PUT /api/posts/:id — Chỉnh sửa bài đăng (Yêu cầu đăng nhập, multer xử lý file, validation)
router.put('/:id',
  authenticateToken,
  postUpdateLimiter,
  uploadPostMedia,
  updatePostValidation,
  postController.updatePost.bind(postController)
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

// GET /api/posts/trash — Thùng rác chứa các bài viết đã xóa mềm (Yêu cầu đăng nhập)
router.get('/trash', authenticateToken, postController.getTrashPosts.bind(postController));

// PATCH /api/posts/:id/visibility — Chủ bài hoặc admin đóng/mở bài viết kèm lý do
router.patch('/:id/visibility',
  authenticateToken,
  postIdValidation,
  postStatusController.updateVisibility.bind(postStatusController)
);

// GET /api/posts/:id — Xem chi tiết (Public)
router.get('/:id',
  optionalAuthenticateToken,
  postIdValidation,
  postController.getPostDetail.bind(postController)
);

// POST /api/posts/:id/comments — Thêm bình luận trong chi tiết bài viết
router.post('/:id/comments',
  authenticateToken,
  commentCreationLimiter,
  uploadCommentMedia,
  createCommentValidation,
  postController.createComment.bind(postController)
);

// POST /api/posts/comments/:commentId/react — Like/Dislike bình luận
router.post('/comments/:commentId/react',
  authenticateToken,
  voteLimiter,
  commentReactionValidation,
  postController.reactComment.bind(postController)
);

// POST /api/posts/:id/react — Like/Dislike bài viết, tách riêng với upvote/downvote
router.post('/:id/react',
  authenticateToken,
  voteLimiter,
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

// DELETE /api/posts/comments/:commentId — Xóa vĩnh viễn bình luận (Yêu cầu đăng nhập)
router.delete('/comments/:commentId',
  authenticateToken,
  commentDeletionLimiter,
  postController.deleteComment.bind(postController)
);

// PATCH /api/posts/comments/:commentId/accept — Đánh dấu/bỏ đánh dấu câu trả lời tốt nhất (Yêu cầu đăng nhập)
router.patch('/comments/:commentId/accept',
  authenticateToken,
  postController.acceptComment.bind(postController)
);

// PUT /api/posts/comments/:commentId — Chỉnh sửa bình luận (Yêu cầu đăng nhập, multer xử lý file, validation)
router.put('/comments/:commentId',
  authenticateToken,
  uploadCommentMedia,
  updateCommentValidation,
  postController.updateComment.bind(postController)
);

// DELETE /api/posts/:id — Xóa mềm bài viết (đưa vào thùng rác) (Yêu cầu đăng nhập)
router.delete('/:id',
  authenticateToken,
  postDeletionLimiter,
  postIdValidation,
  postController.softDeletePost.bind(postController)
);

// PATCH /api/posts/:id/restore — Khôi phục bài viết đã xóa mềm (Yêu cầu đăng nhập)
router.patch('/:id/restore',
  authenticateToken,
  postDeletionLimiter,
  postIdValidation,
  postController.restorePost.bind(postController)
);

// DELETE /api/posts/:id/permanent — Xóa vĩnh viễn bài viết (Yêu cầu đăng nhập)
router.delete('/:id/permanent',
  authenticateToken,
  postDeletionLimiter,
  postIdValidation,
  postController.permanentlyDeletePost.bind(postController)
);

export default router;