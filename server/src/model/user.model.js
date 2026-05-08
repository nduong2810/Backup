import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: false },
    
    // Các trường mới cho Profile
    phone: { type: String, default: "" },
    bio: { type: String, maxLength: 500, default: "" },
    avatar: { type: String, default: "default-avatar.png" },
    major: { type: String, default: "" },

    resetOTP: { type: String, default: null },
    resetOTPExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;