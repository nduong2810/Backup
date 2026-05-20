import express from 'express';
import tagController from '../controller/tag.controller.js';

const router = express.Router();

// GET /api/tags - Danh sách tag + Thống kê
router.get('/', tagController.getTags.bind(tagController));

export default router;
