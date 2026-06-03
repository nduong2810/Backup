import mongoose from 'mongoose';

const donationTransactionSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'vnpay'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending_review', 'pending_payment', 'completed', 'rejected'],
    default: 'pending_review',
    index: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxLength: 500,
  },
  billImage: {
    type: String,
    default: '',
  },
  paymentUrl: {
    type: String,
    default: '',
  },
  orderId: {
    type: String,
    default: '',
    index: true,
  },
  requestId: {
    type: String,
    default: '',
    index: true,
  },
  donorSnapshot: {
    fullName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    major: { type: String, default: '' },
  },
  authorSnapshot: {
    fullName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    major: { type: String, default: '' },
  },
  postSnapshot: {
    title: { type: String, default: '' },
  },
  answerSnapshot: {
    content: { type: String, default: '' },
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

donationTransactionSchema.index({ author: 1, status: 1, createdAt: -1 });
donationTransactionSchema.index({ donor: 1, createdAt: -1 });

const DonationTransaction = mongoose.model('DonationTransaction', donationTransactionSchema);

export default DonationTransaction;