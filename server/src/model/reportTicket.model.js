import mongoose from 'mongoose';

export const flagTypeEnum = [
  'spam',
  'rude_abusive',
  'off_topic',
  'needs_detail',
  'needs_focus',
  'opinion_based',
  'duplicate',
  'very_low_quality',
  'moderator_attention',
  'copyright_infringement',
  'false_info_scam',
  'adult_content',
  'dont_want_to_see',
];

export const flagStatusEnum = [
  'submitted',
  'received',
  'in_review',
  'action_taken',
  'closed',
  'retracted',
];

const historySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: flagStatusEnum,
    required: true,
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  actorRole: {
    type: String,
    enum: ['system', 'user', 'admin'],
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const reportTicketSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false,
    index: true,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false,
    index: true,
  },
  commentContentSnapshot: {
    type: String,
    trim: true,
    default: '',
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  flagType: {
    type: String,
    enum: flagTypeEnum,
    required: true,
    index: true,
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
  status: {
    type: String,
    enum: flagStatusEnum,
    default: 'submitted',
    index: true,
  },
  outcome: {
    type: String,
    enum: ['pending', 'helpful', 'declined', 'retracted'],
    default: 'pending',
  },
  history: {
    type: [historySchema],
    default: [],
  },
}, {
  timestamps: true,
});

reportTicketSchema.index({ reporter: 1, createdAt: -1 });
reportTicketSchema.index({ post: 1, reporter: 1, flagType: 1 }, {
  unique: true,
  partialFilterExpression: { comment: { $exists: false } }
});
reportTicketSchema.index({ comment: 1, reporter: 1, flagType: 1 }, {
  unique: true,
  partialFilterExpression: { comment: { $exists: true } }
});

const ReportTicket = mongoose.model('ReportTicket', reportTicketSchema);

export default ReportTicket;

