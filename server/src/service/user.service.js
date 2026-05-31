import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import donationRepository from '../repository/donation.repository.js';
import { getRankInfo } from './reputation.service.js';

class UserService {
    async getProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) return null;
        const rep = user.reputation || 1;
        return { ...user.toObject(), reputationInfo: { reputation: rep, ...getRankInfo(rep) } };
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

    async getPublicAuthorProfile(userId) {
        const [user, donations, summary] = await Promise.all([
            User.findById(userId).select('-password'),
            donationRepository.findReceivedByAuthor(userId, 20),
            donationRepository.getReceivedSummary(userId),
        ]);

        if (!user) throw { status: 404, message: 'Tác giả không tồn tại' };

        const rep = user.reputation || 1;
        return {
            user: { ...user.toObject(), reputationInfo: { reputation: rep, ...getRankInfo(rep) } },
            donationSummary: {
                totalAmount: summary.totalAmount || 0,
                donationCount: summary.donationCount || 0,
            },
            donations,
        };
    }
}

export default new UserService();