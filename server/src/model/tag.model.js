import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
}, {
    timestamps: true,
});

tagSchema.pre('validate', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name.trim().toLowerCase();
    }
    next();
});

tagSchema.index({ name: 'text', slug: 'text' });

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
