import express from 'express';
import reportController from '../controller/report.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { reportLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, reportLimiter, reportController.createTicket.bind(reportController));
router.get('/my', authenticateToken, reportController.getMyTickets.bind(reportController));
router.get('/admin/flags', authenticateToken, authorizeRole('admin'), reportController.getAllFlagsForAdmin.bind(reportController));
router.get('/posts/:postId/summary', authenticateToken, reportController.getPostSummaryForOwner.bind(reportController));
router.post('/:ticketId/retract', authenticateToken, reportController.retractFlag.bind(reportController));
router.patch('/:ticketId/status', authenticateToken, authorizeRole('admin'), reportController.adminTransition.bind(reportController));

export default router;
