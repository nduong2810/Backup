import { validationResult } from 'express-validator';
import donationService from '../service/donation.service.js';
import adminAuditLogService from '../service/adminAuditLog.service.js';

const toSafeDonation = (donation) => {
  if (!donation) return null;
  return {
    _id: String(donation._id || ''),
    orderId: donation.orderId || '',
    requestId: donation.requestId || '',
    amount: donation.amount,
    paymentMethod: donation.paymentMethod,
    status: donation.status,
    postSnapshot: donation.postSnapshot || null,
    answerSnapshot: donation.answerSnapshot || null,
    donorSnapshot: donation.donorSnapshot || null,
    authorSnapshot: donation.authorSnapshot || null,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
  };
};

const getDonationLabel = (donation) => (
  donation?.orderId
  || donation?.requestId
  || donation?._id?.toString?.()
  || 'Giao dịch ủng hộ'
);

const getDonationMetadata = (donation = {}) => ({
  amount: donation.amount || 0,
  paymentMethod: donation.paymentMethod || '',
  postTitle: donation.postSnapshot?.title || donation.post?.title || '',
  donorId: donation.donor?._id || donation.donor || null,
  donorName: donation.donorSnapshot?.fullName || donation.donor?.fullName || '',
  donorEmail: donation.donor?.email || '',
  authorId: donation.author?._id || donation.author || null,
  authorName: donation.authorSnapshot?.fullName || donation.author?.fullName || '',
  authorEmail: donation.author?.email || '',
});

const auditDonationReview = async ({ req, donation, action, reason = '' }) => {
  await adminAuditLogService.log({
    req,
    action,
    targetType: 'donation',
    targetId: donation?._id,
    targetLabel: getDonationLabel(donation),
    previousState: { status: 'pending_review' },
    newState: {
      status: donation?.status || '',
      approvedAt: donation?.approvedAt || null,
      rejectedAt: donation?.rejectedAt || null,
    },
    reason,
    metadata: getDonationMetadata(donation),
  });
};

class DonationController {
  checkValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
  }

  async createCheckout(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const result = await donationService.createCheckout(req.user.userId, req.body);
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          donation: toSafeDonation(result.donation),
          paymentUrl: result.paymentUrl,
        },
      });
    } catch (error) {
      console.error('[DonationController] createCheckout failed:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tạo giao dịch ủng hộ',
      });
    }
  }

  async listAdminDonations(req, res) {
    try {
      const donations = await donationService.getAdminDonations(req.query);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách giao dịch thành công',
        data: donations,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tải danh sách giao dịch',
      });
    }
  }

  async listAllAdminDonations(req, res) {
    try {
      const result = await donationService.getAllAdminDonations(req.query);
      return res.status(200).json({
        success: true,
        message: 'Lấy toàn bộ lịch sử giao dịch quyên góp thành công',
        data: result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tải danh sách giao dịch quyên góp',
      });
    }
  }

  async confirmVnpayPayment(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const donation = await donationService.confirmVnpayPayment(req.body);
      return res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán thành công',
        data: toSafeDonation(donation),
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể xác nhận thanh toán',
      });
    }
  }

  async approveCodDonation(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const donation = await donationService.approveCodDonation(req.params.donationId, req.user.userId);
      await auditDonationReview({
        req,
        donation,
        action: 'donation_approved',
        reason: String(req.body?.reason || '').trim() || 'Admin duyệt bill chuyển khoản thủ công',
      });
      return res.status(200).json({
        success: true,
        message: 'Đã duyệt giao dịch thành công',
        data: donation,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể duyệt giao dịch',
      });
    }
  }

  async rejectCodDonation(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const reason = String(req.body?.reason || '').trim() || 'Admin không duyệt bill chuyển khoản';
      const donation = await donationService.rejectCodDonation(
        req.params.donationId,
        req.user.userId,
        reason,
      );

      await auditDonationReview({
        req,
        donation,
        action: 'donation_rejected',
        reason,
      });

      return res.status(200).json({
        success: true,
        message: 'Đã từ chối giao dịch thành công',
        data: donation,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể từ chối giao dịch',
      });
    }
  }

  async getAuthorProfile(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const result = await donationService.getAuthorDonationProfile(req.params.userId);
      return res.status(200).json({
        success: true,
        message: 'Lấy hồ sơ tác giả thành công',
        data: result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tải hồ sơ tác giả',
      });
    }
  }
}

export default new DonationController();
