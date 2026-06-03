import mongoose from 'mongoose';

const savedCollectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 60,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

savedCollectionSchema.index({ user: 1, name: 1 }, { unique: true });

const SavedCollection = mongoose.model('SavedCollection', savedCollectionSchema);
export default SavedCollection;
