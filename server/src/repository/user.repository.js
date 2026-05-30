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

    async updateUserByEmail(email, updateData) {
        return await User.findOneAndUpdate({ email }, updateData, { new: true });
    }

    // Khởi tạo user mới vào Database
    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }
}

export default new UserRepository();