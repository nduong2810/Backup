import mongoose from 'mongoose';

const reputationHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    reputationEarned: { type: Number, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, index: true }, // postId or donationId
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

const ReputationHistory = mongoose.model('ReputationHistory', reputationHistorySchema);
export default ReputationHistory;
