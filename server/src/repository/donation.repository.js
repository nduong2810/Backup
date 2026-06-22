import mongoose from 'mongoose';
import DonationTransaction from '../model/donationTransaction.model.js';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDonationLookups = () => [
  {
    $lookup: {
      from: 'users',
      localField: 'donor',
      foreignField: '_id',
      as: 'donorDoc',
    },
  },
  { $unwind: { path: '$donorDoc', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorDoc',
    },
  },
  { $unwind: { path: '$authorDoc', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'posts',
      localField: 'post',
      foreignField: '_id',
      as: 'postDoc',
    },
  },
  { $unwind: { path: '$postDoc', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'comments',
      localField: 'answer',
      foreignField: '_id',
      as: 'answerDoc',
    },
  },
  { $unwind: { path: '$answerDoc', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'approvedBy',
      foreignField: '_id',
      as: 'approvedByDoc',
    },
  },
  { $unwind: { path: '$approvedByDoc', preserveNullAndEmptyArrays: true } },
];

const projectDonationForAdmin = () => ({
  _id: 1,
  orderId: 1,
  requestId: 1,
  amount: 1,
  paymentMethod: 1,
  status: 1,
  note: 1,
  hasBillImage: { $ne: [{ $ifNull: ['$billImage', ''] }, ''] },
  paymentUrl: 1,
  donorSnapshot: 1,
  authorSnapshot: 1,
  postSnapshot: 1,
  answerSnapshot: 1,
  createdAt: 1,
  updatedAt: 1,
  approvedAt: 1,
  completedAt: 1,
  rejectedAt: 1,
  gatewayResponse: 1,
  donor: {
    _id: '$donorDoc._id',
    fullName: '$donorDoc.fullName',
    email: '$donorDoc.email',
    avatar: '$donorDoc.avatar',
    major: '$donorDoc.major',
  },
  author: {
    _id: '$authorDoc._id',
    fullName: '$authorDoc.fullName',
    email: '$authorDoc.email',
    avatar: '$authorDoc.avatar',
    major: '$authorDoc.major',
  },
  post: {
    _id: '$postDoc._id',
    title: '$postDoc.title',
    status: '$postDoc.status',
  },
  answer: {
    _id: '$answerDoc._id',
    content: '$answerDoc.content',
  },
  approvedBy: {
    _id: '$approvedByDoc._id',
    fullName: '$approvedByDoc.fullName',
    email: '$approvedByDoc.email',
  },
  donorName: { $ifNull: ['$donorDoc.fullName', '$donorSnapshot.fullName'] },
  authorName: { $ifNull: ['$authorDoc.fullName', '$authorSnapshot.fullName'] },
});

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

  async findAllAdminDonations({
    status = '',
    paymentMethod = '',
    keyword = '',
    page = 1,
    limit = 10,
    startDate = null,
    fromDate = null,
    toDate = null,
  } = {}) {
    const match = {};
    if (status) match.status = status;
    if (paymentMethod) match.paymentMethod = paymentMethod;

    const createdAtFilter = {};
    if (fromDate) createdAtFilter.$gte = fromDate;
    if (toDate) createdAtFilter.$lte = toDate;
    if (Object.keys(createdAtFilter).length > 0) match.createdAt = createdAtFilter;

    const searchText = String(keyword || '').trim();
    const searchMatch = searchText
      ? {
          $or: [
            { 'donorDoc.fullName': { $regex: escapeRegex(searchText), $options: 'i' } },
            { 'donorDoc.email': { $regex: escapeRegex(searchText), $options: 'i' } },
            { 'authorDoc.fullName': { $regex: escapeRegex(searchText), $options: 'i' } },
            { 'authorDoc.email': { $regex: escapeRegex(searchText), $options: 'i' } },
            { 'donorSnapshot.fullName': { $regex: escapeRegex(searchText), $options: 'i' } },
            { 'authorSnapshot.fullName': { $regex: escapeRegex(searchText), $options: 'i' } },
          ],
        }
      : null;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(5, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const basePipeline = [
      { $match: match },
      ...buildDonationLookups(),
    ];

    if (searchMatch) basePipeline.push({ $match: searchMatch });

    const timelineMatch = (!fromDate && !toDate && startDate) ? [{ $match: { createdAt: { $gte: startDate } } }] : [];

    const [result] = await DonationTransaction.aggregate([
      ...basePipeline,
      {
        $facet: {
          items: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: safeLimit },
            { $project: projectDonationForAdmin() },
          ],
          total: [{ $count: 'count' }],
          summary: [
            {
              $group: {
                _id: null,
                donationCount: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                completedAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
                  },
                },
                completedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                  },
                },
                pendingReviewCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0],
                  },
                },
                pendingPaymentCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'pending_payment'] }, 1, 0],
                  },
                },
                rejectedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
                  },
                },
              },
            },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
            { $sort: { _id: 1 } },
          ],
          byPaymentMethod: [
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
            { $sort: { _id: 1 } },
          ],
          timeline: [
            ...timelineMatch,
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                },
                totalAmount: { $sum: '$amount' },
                completedAmount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0],
                  },
                },
                donationCount: { $sum: 1 },
                completedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
        },
      },
    ]);

    const total = result?.total?.[0]?.count || 0;
    const summary = result?.summary?.[0] || {
      donationCount: 0,
      totalAmount: 0,
      completedAmount: 0,
      completedCount: 0,
      pendingReviewCount: 0,
      pendingPaymentCount: 0,
      rejectedCount: 0,
    };

    return {
      donations: result?.items || [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      summary,
      byStatus: result?.byStatus || [],
      byPaymentMethod: result?.byPaymentMethod || [],
      timeline: result?.timeline || [],
    };
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