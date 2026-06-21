import { param, body, query } from 'express-validator';

// ====================================================================
// POST VALIDATION - Lớp 1: Input Validation cho Post APIs
// ====================================================================

export const postIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ')
];

export const voteValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ'),
    body('voteType')
        .isIn(['upvote', 'downvote'])
        .withMessage('Loại vote không hợp lệ (chỉ chấp nhận: upvote, downvote)')
];

export const postReactionValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ'),
    body('reactionType')
        .isIn(['like', 'dislike'])
        .withMessage('Loại phản ứng không hợp lệ'),
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

export const commentReactionValidation = [
    param('commentId')
        .isMongoId()
        .withMessage('ID bình luận không hợp lệ'),
    body('reactionType')
        .isIn(['like', 'dislike'])
        .withMessage('Loại phản ứng không hợp lệ'),
];

export const relatedPostsValidation = [
    param('tag')
        .notEmpty()
        .withMessage('Tag không được để trống')
        .trim()
        .isLength({ max: 50 })
        .withMessage('Tag tối đa 50 ký tự')
];

export const createPostValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề không được để trống')
        .isLength({ max: 200 })
        .withMessage('Tiêu đề tối đa 200 ký tự'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung không được để trống'),
    body('postType')
        .optional()
        .isIn(['question', 'advice'])
        .withMessage('Loại bài viết không hợp lệ'),
    body('tags')
        .optional()
];

export const updatePostValidation = [
    param('id')
        .isMongoId()
        .withMessage('ID bài viết không hợp lệ'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề không được để trống')
        .isLength({ max: 200 })
        .withMessage('Tiêu đề tối đa 200 ký tự'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung không được để trống'),
    body('tags')
        .optional()
];

export const updateCommentValidation = [
    param('commentId')
        .isMongoId()
        .withMessage('ID bình luận không hợp lệ'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung bình luận không được để trống')
        .isLength({ max: 2000 })
        .withMessage('Nội dung bình luận tối đa 2000 ký tự')
];