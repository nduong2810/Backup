import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';

class UserService {
    async getProfile(userId) {
        return await User.findById(userId).select('-password'); // Ẩn mật khẩu
    }

    async updateProfile(userId, updateData) {
        // Cập nhật và lấy bản ghi mới nhất
        return await User.findByIdAndUpdate(
            userId, 
            { $set: updateData }, 
            { new: true, runValidators: true } 
        ).select('-password');
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId);
        
        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new Error("Mật khẩu hiện tại không đúng");

        // Hash mật khẩu mới và lưu
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
    }
}

export default new UserService();