import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpiry: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;
