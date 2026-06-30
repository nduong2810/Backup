import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { donationLimiter } from '../middleware/rateLimit.middleware.js';
import donationController from '../controller/donation.controller.js';
import {
  authorIdValidation,
  createDonationValidation,
  donationIdValidation,
  vnpayConfirmValidation,
} from '../validation/donation.validation.js';

const router = express.Router();
const adminOnly = [authenticateToken, authorizeRole('admin')];

router.post('/', authenticateToken, donationLimiter, createDonationValidation, donationController.createCheckout.bind(donationController));

router.post('/gateway/vnpay/confirm', vnpayConfirmValidation, donationController.confirmVnpayPayment.bind(donationController));

router.get('/admin/all', ...adminOnly, donationController.listAllAdminDonations.bind(donationController));

router.get('/admin', ...adminOnly, donationController.listAdminDonations.bind(donationController));

router.patch('/admin/:donationId/approve', ...adminOnly, donationIdValidation, donationController.approveCodDonation.bind(donationController));

router.patch('/admin/:donationId/reject', ...adminOnly, donationIdValidation, donationController.rejectCodDonation.bind(donationController));

router.get('/authors/:userId', authorIdValidation, donationController.getAuthorProfile.bind(donationController));

export default router;
