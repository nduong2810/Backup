import { param, body, query } from 'express-validator';

// ====================================================================
// POST VALIDATION - Lớp 1: Input Validation cho Post APIs
// ====================================================================

// Validate postId phải là MongoDB ObjectId hợp lệ
export const postIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ')
];

// Validate vote request
export const voteValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ'),
    body('voteType')
        .isIn(['upvote', 'downvote'])
        .withMessage('Loại vote không hợp lệ (chỉ chấp nhận: upvote, downvote)')
];

export const createCommentValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung bình luận không được để trống')
        .isLength({ max: 2000 })
        .withMessage('Nội dung bình luận tối đa 2000 ký tự'),
    body('parentComment')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('ID bình luận cha không hợp lệ'),
];

// Validate tag parameter cho bài viết liên quan
export const relatedPostsValidation = [
    param('tag')
        .notEmpty()
        .withMessage('Tag không được để trống')
        .trim()
        .isLength({ max: 50 })
        .withMessage('Tag tối đa 50 ký tự')
];