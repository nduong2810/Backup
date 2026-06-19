import tagRepository from '../repository/tag.repository.js';

class TagService {
    async getTags(query) {
        const {
            search = '',
            page = 1,
            limit = 24,
            sortBy = 'posts',
        } = query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));
        const skip = (pageNum - 1) * limitNum;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { items, total } = await tagRepository.findTags({
            search,
            skip,
            limit: limitNum,
            startOfToday,
            sortBy,
        });

        return {
            data: items,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }
}

export default new TagService();
