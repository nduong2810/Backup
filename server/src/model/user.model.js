import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['active', 'banned', 'deactivated', 'pending_delete'], 
        default: 'active' 
    },
    deletionScheduledAt: { type: Date, default: null },
    
    // Các trường mới cho Profile
    phone: { type: String, default: "" },
    bio: { type: String, maxLength: 500, default: "" },
    avatar: { type: String, default: "default-avatar.png" },
    major: { type: String, default: "" },

    // Dành cho chức năng Register (Xác thực tài khoản)
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // Hệ thống Reputation
    reputation: { type: Number, default: 1, min: 1 },
    // Theo dõi daily cap: số điểm kiếm được trong ngày (từ upvote)
    reputationDailyEarned: { type: Number, default: 0 },
    reputationDailyDate: { type: Date, default: null },

    // Dành cho cơ chế Free Votes tuần của thành viên mới
    weeklyFreeVotesUsed: { type: Number, default: 0 },
    weeklyFreeVotesDate: { type: Date, default: null },
    hasSeenFreeVotesModal: { type: Boolean, default: false },

    // Dành cho chức năng Quên mật khẩu
    resetOTP: { type: String, default: null },
    resetOTPExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;