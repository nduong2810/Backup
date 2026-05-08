import User from '../model/user.model.js';

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async updateUserByEmail(email, updateData) {
        return await User.findOneAndUpdate({ email }, updateData, { new: true });
    }
}

export default new UserRepository();