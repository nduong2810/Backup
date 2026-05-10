import User from '../model/user.model.js';

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email });
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