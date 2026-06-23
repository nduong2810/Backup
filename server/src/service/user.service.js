import User from '../model/user.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import bcrypt from 'bcryptjs';
import donationRepository from '../repository/donation.repository.js';
import postRepository from '../repository/post.repository.js';
import userRepository from '../repository/user.repository.js';
import { getRankInfo, getTodayStart, getThisWeekStart } from './reputation.service.js';
import { uploadToCloudinary } from '../util/cloudinary.js';
import SystemSetting from '../model/systemSetting.model.js';
import { stripHtmlTags } from '../util/sanitize.js';

const normalizeBankProfileFields = (data = {}) => ({
    fullName: typeof data.fullName === 'string' ? stripHtmlTags(data.fullName) : data.fullName,
    phone: typeof data.phone === 'string' ? stripHtmlTags(data.phone) : data.phone,
    major: typeof data.major === 'string' ? stripHtmlTags(data.major) : data.major,
    bio: typeof data.bio === 'string' ? stripHtmlTags(data.bio) : data.bio,
    avatar: data.avatar,
    bankName: typeof data.bankName === 'string' ? stripHtmlTags(data.bankName) : data.bankName,
    bankAccountNumber: typeof data.bankAccountNumber === 'string' ? stripHtmlTags(data.bankAccountNumber) : data.bankAccountNumber,
});

class UserService {
    async getProfile(userId) {
        const user = await User.findById(userId).select('-password').lean();
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

        // Xử lý kiểm tra và reset tuần của free votes
        const weekStart = getThisWeekStart();
        const sameWeek = user.weeklyFreeVotesDate &&
            new Date(user.weeklyFreeVotesDate).getTime() === weekStart.getTime();
        
        let weeklyFreeVotesUsed = user.weeklyFreeVotesUsed || 0;
        if (!sameWeek) {
            weeklyFreeVotesUsed = 0;
            await User.findByIdAndUpdate(userId, {
                $set: {
                    weeklyFreeVotesUsed: 0,
                    weeklyFreeVotesDate: weekStart
                }
            });
        }

        return { 
            ...user,
            bankName: user.bankName || '',
            bankAccountNumber: user.bankAccountNumber || '',
            reputationInfo: { 
                reputation: rep, 
                dailyCap,
                dailyEarned,
                ...getRankInfo(rep),
                weeklyFreeVotesUsed,
                weeklyFreeVotesLimit: 5,
                hasSeenFreeVotesModal: user.hasSeenFreeVotesModal || false,
            } 
        };
    }

    async updateProfile(userId, updateData) {
        const safeUpdate = normalizeBankProfileFields(updateData);
        Object.keys(safeUpdate).forEach((key) => {
            if (safeUpdate[key] === undefined) delete safeUpdate[key];
        });

        if (safeUpdate.avatar) {
            safeUpdate.avatar = await uploadToCloudinary(safeUpdate.avatar);
        }

        await User.collection.updateOne(
            { _id: new User.base.Types.ObjectId(userId) },
            { $set: safeUpdate }
        );

        const updatedUser = await User.findById(userId).select('-password').lean();
        return {
            ...updatedUser,
            bankName: updatedUser?.bankName || '',
            bankAccountNumber: updatedUser?.bankAccountNumber || '',
        };
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
            User.findById(userId).select('-password').lean(),
            donationRepository.findReceivedByAuthor(userId, 20),
            donationRepository.getReceivedSummary(userId),
            postRepository.findPublicPostsByAuthor(userId, skip, limitNum),
            postRepository.countPublicPostsByAuthor(userId),
            postRepository.getPublicAuthorPostSummary(userId),
        ]);

        if (!user || !user.isActive) throw { status: 404, message: 'Tác giả không tồn tại hoặc tài khoản đã bị khóa' };

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
                ...user,
                bankName: user.bankName || '',
                bankAccountNumber: user.bankAccountNumber || '',
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

    async deactivateAccount(userId) {
        await User.findByIdAndUpdate(userId, {
            $set: {
                isActive: false,
                status: 'deactivated'
            }
        });
        await Promise.all([
            Post.updateMany({ author: userId }, { $set: { isAuthorActive: false } }),
            Comment.updateMany({ author: userId }, { $set: { isAuthorActive: false } })
        ]);
    }

    async deleteAccount(userId) {
        // Hạn xóa là 7 ngày kể từ hiện tại
        const deletionScheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await User.findByIdAndUpdate(userId, {
            $set: {
                isActive: false,
                status: 'pending_delete',
                deletionScheduledAt
            }
        });
        await Promise.all([
            Post.updateMany({ author: userId }, { $set: { isAuthorActive: false } }),
            Comment.updateMany({ author: userId }, { $set: { isAuthorActive: false } })
        ]);
    }
}

export default new UserService();