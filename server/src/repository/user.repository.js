import User from '../model/user.model.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async findById(userId) {
        return await User.findById(userId).select('-password');
    }

    async findByFullName(fullName) {
        if (!fullName) return null;
        return await User.findOne({
            fullName: new RegExp(`^${escapeRegex(fullName.trim())}$`, 'i'),
        }).select('-password');
    }

    async findByUsername(username) {
        if (!username) return null;
        return await User.findOne({
            username: new RegExp(`^${escapeRegex(username.trim())}$`, 'i'),
        }).select('-password');
    }

    async searchAuthorsByName(query, limit = 8) {
        const keyword = query?.trim();
        if (!keyword) return [];

        return await User.find({
            role: 'user',
            isActive: true,
            fullName: new RegExp(escapeRegex(keyword), 'i'),
        })
            .select('_id fullName avatar reputation')
            .sort({ reputation: -1, fullName: 1 })
            .limit(limit)
            .lean();
    }

    updateUserByEmail(email, updateData) {
        return User.findOneAndUpdate({ email }, updateData, { new: true });
    }

    // Khởi tạo user mới vào Database
    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }
}

export default new UserRepository();
