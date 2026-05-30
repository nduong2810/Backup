import { validationResult } from 'express-validator';
import donationService from '../service/donation.service.js';

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
          donation: result.donation,
          paymentUrl: result.paymentUrl,
        },
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Không thể tạo giao dịch ủng hộ',
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
        data: donation,
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