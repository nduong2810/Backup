import { body, param } from 'express-validator';

export const createCollectionValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Ten thu muc khong duoc de trong')
        .isLength({ max: 60 }).withMessage('Ten thu muc toi da 60 ky tu'),
];

export const renameCollectionValidation = [
    param('id').isMongoId().withMessage('ID thu muc khong hop le'),
    body('name')
        .trim()
        .notEmpty().withMessage('Ten thu muc khong duoc de trong')
        .isLength({ max: 60 }).withMessage('Ten thu muc toi da 60 ky tu'),
];

export const deleteCollectionValidation = [
    param('id').isMongoId().withMessage('ID thu muc khong hop le'),
];

export const savePostValidation = [
    body('postId').isMongoId().withMessage('Post ID khong hop le'),
    body('collectionId').optional().isMongoId().withMessage('Collection ID khong hop le'),
];

export const removeSavedPostValidation = [
    param('postId').isMongoId().withMessage('Post ID khong hop le'),
];

export const removeSavedPostsValidation = [
    body('postIds')
        .isArray({ min: 1 }).withMessage('Danh sach postIds khong hop le'),
    body('postIds.*').isMongoId().withMessage('Post ID khong hop le'),
];

export const moveSavedPostsValidation = [
    body('postIds')
        .isArray({ min: 1 }).withMessage('Danh sach postIds khong hop le'),
    body('postIds.*').isMongoId().withMessage('Post ID khong hop le'),
    body('toCollectionId').isMongoId().withMessage('Collection ID khong hop le'),
];
