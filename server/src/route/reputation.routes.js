import express from 'express';
import reputationController from '../controller/reputation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { param } from 'express-validator';

const router = express.Router();

// GET /api/reputation/me — Reputation của bản thân (auth required)
router.get('/me', authenticateToken, reputationController.getMyReputation.bind(reputationController));

// GET /api/reputation/users/:userId — Reputation công khai theo userId
router.get(
    '/users/:userId',
    [param('userId').isMongoId().withMessage('userId không hợp lệ')],
    reputationController.getUserReputation.bind(reputationController)
);

export default router;
