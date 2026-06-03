import savedService from '../service/saved.service.js';
import { validationResult } from 'express-validator';

class SavedController {
    checkValidationErrors(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        return null;
    }

    async getSavedIds(req, res) {
        try {
            const userId = req.user.userId;
            const ids = await savedService.getSavedPostIds(userId);
            res.status(200).json({ success: true, data: ids });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCollections(req, res) {
        try {
            const userId = req.user.userId;
            const collections = await savedService.getCollections(userId);
            res.status(200).json({ success: true, data: collections });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createCollection(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { name } = req.body;
            const collection = await savedService.createCollection(userId, name);
            res.status(201).json({ success: true, data: collection });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async renameCollection(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { name } = req.body;
            const collection = await savedService.renameCollection(userId, id, name);
            res.status(200).json({ success: true, data: collection });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteCollection(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const defaultCollection = await savedService.deleteCollection(userId, id);
            res.status(200).json({ success: true, data: defaultCollection });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getSavedPosts(req, res) {
        try {
            const userId = req.user.userId;
            const { collectionId } = req.query;
            const posts = await savedService.getSavedPosts(userId, collectionId || null);
            res.status(200).json({ success: true, data: posts });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async savePost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { postId, collectionId } = req.body;
            const result = await savedService.savePost(userId, postId, collectionId || null);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async removeSavedPost(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { postId } = req.params;
            const result = await savedService.removeSavedPost(userId, postId);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async removeSavedPosts(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { postIds } = req.body;
            const result = await savedService.removeSavedPosts(userId, postIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async moveSavedPosts(req, res) {
        const validationError = this.checkValidationErrors(req, res);
        if (validationError) return validationError;

        try {
            const userId = req.user.userId;
            const { postIds, toCollectionId } = req.body;
            const result = await savedService.moveSavedPosts(userId, postIds, toCollectionId);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new SavedController();
