import mongoose from 'mongoose';
import DonationTransaction from '../model/donationTransaction.model.js';

class DonationRepository {
  async createDonation(data) {
    const donation = new DonationTransaction(data);
    return await donation.save();
  }

  async findById(donationId) {
    return await DonationTransaction.findById(donationId)
      .populate('donor', 'fullName avatar major email')
      .populate('author', 'fullName avatar major email')
      .populate('post', 'title')
      .populate('answer', 'content');
  }

  async findByOrderId(orderId) {
    return await DonationTransaction.findOne({ orderId })
      .populate('donor', 'fullName avatar major email')
      .populate('author', 'fullName avatar major email')
      .populate('post', 'title')
      .populate('answer', 'content');
  }

  async findAdminDonations({ status = '', paymentMethod = '', limit = 100 } = {}) {
    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    return await DonationTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 100)
      .populate('donor', 'fullName avatar major email')
      .populate('author', 'fullName avatar major email')
      .populate('post', 'title')
      .populate('answer', 'content')
      .populate('approvedBy', 'fullName email');
  }

  async findReceivedByAuthor(authorId, limit = 20) {
    return await DonationTransaction.find({
      author: authorId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('donor', 'fullName avatar major')
      .populate('post', 'title')
      .populate('answer', 'content');
  }

  async getReceivedSummary(authorId) {
    const authorObjectId = mongoose.Types.ObjectId.isValid(authorId)
      ? new mongoose.Types.ObjectId(authorId)
      : authorId;

    const [summary] = await DonationTransaction.aggregate([
      {
        $match: {
          author: authorObjectId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    return summary || { totalAmount: 0, donationCount: 0 };
  }

  async updateStatus(donationId, updateData) {
    return await DonationTransaction.findByIdAndUpdate(
      donationId,
      { $set: updateData },
      { new: true },
    )
      .populate('donor', 'fullName avatar major email')
      .populate('author', 'fullName avatar major email')
      .populate('post', 'title')
      .populate('answer', 'content');
  }
}

export default new DonationRepository();