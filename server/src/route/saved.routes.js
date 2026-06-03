import express from 'express';
import savedController from '../controller/saved.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    createCollectionValidation,
    renameCollectionValidation,
    deleteCollectionValidation,
    savePostValidation,
    removeSavedPostValidation,
    removeSavedPostsValidation,
    moveSavedPostsValidation,
} from '../validation/saved.validation.js';

const router = express.Router();

router.get('/ids', authenticateToken, savedController.getSavedIds.bind(savedController));

router.get('/collections', authenticateToken, savedController.getCollections.bind(savedController));
router.post('/collections', authenticateToken, createCollectionValidation, savedController.createCollection.bind(savedController));
router.patch('/collections/:id', authenticateToken, renameCollectionValidation, savedController.renameCollection.bind(savedController));
router.delete('/collections/:id', authenticateToken, deleteCollectionValidation, savedController.deleteCollection.bind(savedController));

router.get('/posts', authenticateToken, savedController.getSavedPosts.bind(savedController));
router.post('/posts', authenticateToken, savePostValidation, savedController.savePost.bind(savedController));
router.delete('/posts', authenticateToken, removeSavedPostsValidation, savedController.removeSavedPosts.bind(savedController));
router.delete('/posts/:postId', authenticateToken, removeSavedPostValidation, savedController.removeSavedPost.bind(savedController));
router.patch('/posts/move', authenticateToken, moveSavedPostsValidation, savedController.moveSavedPosts.bind(savedController));

export default router;
