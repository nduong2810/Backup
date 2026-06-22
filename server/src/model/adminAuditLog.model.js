import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      'user_status_update',
      'post_status_update',
      'donation_approved',
      'donation_rejected',
    ],
    required: true,
    index: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'donation'],
    required: true,
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  targetLabel: {
    type: String,
    trim: true,
    default: '',
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  reason: {
    type: String,
    trim: true,
    maxLength: 1000,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    trim: true,
    default: '',
  },
  userAgent: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ actor: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
export default AdminAuditLog;
