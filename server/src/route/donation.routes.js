import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import donationController from '../controller/donation.controller.js';
import {
  authorIdValidation,
  createDonationValidation,
  donationIdValidation,
  vnpayConfirmValidation,
} from '../validation/donation.validation.js';

const router = express.Router();

router.post('/', authenticateToken, createDonationValidation, donationController.createCheckout.bind(donationController));

router.post('/gateway/vnpay/confirm', vnpayConfirmValidation, donationController.confirmVnpayPayment.bind(donationController));

router.get('/admin', authenticateToken, authorizeRole('admin'), donationController.listAdminDonations.bind(donationController));

router.patch('/admin/:donationId/approve', authenticateToken, authorizeRole('admin'), donationIdValidation, donationController.approveCodDonation.bind(donationController));

router.patch('/admin/:donationId/reject', authenticateToken, authorizeRole('admin'), donationIdValidation, donationController.rejectCodDonation.bind(donationController));

router.get('/authors/:userId', authorIdValidation, donationController.getAuthorProfile.bind(donationController));

export default router;