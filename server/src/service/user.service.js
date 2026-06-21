import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import donationRepository from '../repository/donation.repository.js';
import postRepository from '../repository/post.repository.js';
import userRepository from '../repository/user.repository.js';
import { getRankInfo, getTodayStart } from './reputation.service.js';
import { uploadToCloudinary } from '../util/cloudinary.js';
import SystemSetting from '../model/systemSetting.model.js';

class UserService {
    async getProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) return null;
        const rep = user.reputation || 1;

        let dailyCap = 200;
        try {
            const setting = await SystemSetting.findOne({ key: 'reputation_daily_cap' });
            if (setting && typeof setting.value === 'number') {
                dailyCap = setting.value;
            }
        } catch (err) {
            console.error('[UserService] Error loading reputation_daily_cap:', err);
        }

        const todayStart = getTodayStart();
        const sameDay = user.reputationDailyDate &&
            new Date(user.reputationDailyDate).getTime() === todayStart.getTime();
        const dailyEarned = sameDay ? (user.reputationDailyEarned || 0) : 0;

        return { 
            ...user.toObject(), 
            reputationInfo: { 
                reputation: rep, 
                dailyCap,
                dailyEarned,
                ...getRankInfo(rep) 
            } 
        };
    }

    async updateProfile(userId, updateData) {
        if (updateData.avatar) {
            updateData.avatar = await uploadToCloudinary(updateData.avatar);
        }
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

    async searchAuthors(query = {}) {
        const keyword = String(query.q || '').trim();
        const limit = Math.min(10, Math.max(1, parseInt(query.limit, 10) || 8));
        if (keyword.length < 2) return [];

        return await userRepository.searchAuthorsByName(keyword, limit);
    }

    async getPublicAuthorProfile(userId, query = {}) {
        const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
        const limitNum = Math.min(10, Math.max(1, parseInt(query.limit, 10) || 5));
        const skip = (pageNum - 1) * limitNum;

        const [user, donations, summary, posts, totalPosts, postSummary] = await Promise.all([
            User.findById(userId).select('-password'),
            donationRepository.findReceivedByAuthor(userId, 20),
            donationRepository.getReceivedSummary(userId),
            postRepository.findPublicPostsByAuthor(userId, skip, limitNum),
            postRepository.countPublicPostsByAuthor(userId),
            postRepository.getPublicAuthorPostSummary(userId),
        ]);

        if (!user) throw { status: 404, message: 'Tác giả không tồn tại' };

        const rep = user.reputation || 1;

        let dailyCap = 200;
        try {
            const setting = await SystemSetting.findOne({ key: 'reputation_daily_cap' });
            if (setting && typeof setting.value === 'number') {
                dailyCap = setting.value;
            }
        } catch (err) {
            console.error('[UserService] Error loading reputation_daily_cap:', err);
        }

        const todayStart = getTodayStart();
        const sameDay = user.reputationDailyDate &&
            new Date(user.reputationDailyDate).getTime() === todayStart.getTime();
        const dailyEarned = sameDay ? (user.reputationDailyEarned || 0) : 0;

        return {
            user: { 
                ...user.toObject(), 
                reputationInfo: { 
                    reputation: rep, 
                    dailyCap,
                    dailyEarned,
                    ...getRankInfo(rep) 
                } 
            },
            donationSummary: {
                totalAmount: summary.totalAmount || 0,
                donationCount: summary.donationCount || 0,
            },
            donations,
            postSummary: {
                totalPosts,
                questionCount: postSummary.questionCount || 0,
                adviceCount: postSummary.adviceCount || 0,
                totalViews: postSummary.totalViews || 0,
                totalUpvotes: postSummary.totalUpvotes || 0,
                totalLikes: postSummary.totalLikes || 0,
            },
            posts,
            postsPagination: {
                total: totalPosts,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.max(1, Math.ceil(totalPosts / limitNum)),
            },
        };
    }
}

export default new UserService();
