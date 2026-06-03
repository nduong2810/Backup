import mongoose from 'mongoose';

const savedPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true,
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SavedCollection',
        required: true,
        index: true,
    },
}, { timestamps: true });

savedPostSchema.index({ user: 1, post: 1 }, { unique: true });

const SavedPost = mongoose.model('SavedPost', savedPostSchema);
export default SavedPost;
