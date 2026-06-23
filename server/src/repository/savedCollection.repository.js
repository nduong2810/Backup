import SavedCollection from '../model/savedCollection.model.js';

class SavedCollectionRepository {
    async findByUser(userId) {
        return await SavedCollection.find({ user: userId })
            .sort({ isDefault: -1, createdAt: 1, name: 1 })
            .lean();
    }

    async findById(collectionId) {
        return await SavedCollection.findById(collectionId);
    }

    async findDefaultByUser(userId) {
        return await SavedCollection.findOne({ user: userId, isDefault: true });
    }

    async createCollection(data) {
        const collection = new SavedCollection(data);
        return await collection.save();
    }

    async updateCollection(collectionId, updateData) {
        return await SavedCollection.findByIdAndUpdate(collectionId, updateData, { new: true });
    }

    async deleteCollection(collectionId) {
        return await SavedCollection.findByIdAndDelete(collectionId);
    }
}

export default new SavedCollectionRepository();
