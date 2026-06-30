import mongoose from 'mongoose';
import { slugify } from '../util/slugify.js';

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

tagSchema.pre('validate', function() {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name);
    }
});

tagSchema.index({ name: 'text', slug: 'text' });

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
