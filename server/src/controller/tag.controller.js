import tagService from '../service/tag.service.js';

class TagController {
    async getTags(req, res) {
        try {
            const result = await tagService.getTags(req.query);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error('[TagController] getTags error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách tags',
            });
        }
    }
}

export default new TagController();
