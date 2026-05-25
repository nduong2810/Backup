import PendingUser from '../model/pendingUser.model.js';

class PendingUserRepository {
    async findByEmail(email) {
        return await PendingUser.findOne({ email });
    }

    async createPendingUser(userData) {
        const pendingUser = new PendingUser(userData);
        return await pendingUser.save();
    }

    async updatePendingUserByEmail(email, updateData) {
        return await PendingUser.findOneAndUpdate({ email }, updateData, { new: true });
    }

    async deleteByEmail(email) {
        return await PendingUser.findOneAndDelete({ email });
    }
}

export default new PendingUserRepository();
