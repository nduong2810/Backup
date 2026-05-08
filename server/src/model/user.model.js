import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: false },
    
    // Các trường phục vụ Quên mật khẩu
    resetOTP: { type: String, default: null },
    resetOTPExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;