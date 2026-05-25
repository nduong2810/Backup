import Tag from '../model/tag.model.js';

class TagRepository {
    async findTags({ search = '', skip = 0, limit = 24, startOfToday }) {
        const normalizedSearch = search.trim();
        const basePipeline = [];

        if (normalizedSearch) {
            basePipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: normalizedSearch, $options: 'i' } },
                        { slug: { $regex: normalizedSearch, $options: 'i' } },
                    ],
                },
            });
        }

        const itemsPipeline = [
            ...basePipeline,
            {
                $lookup: {
                    from: 'posts',
                    let: { tag: '$slug', startOfToday },
                    pipeline: [
                        { $match: { status: { $ne: 'deleted' } } },
                        { $match: { $expr: { $in: ['$$tag', '$tags'] } } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                today: {
                                    $sum: {
                                        $cond: [
                                            { $gte: ['$createdAt', '$$startOfToday'] },
                                            1,
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                    as: 'stats',
                },
            },
            {
                $addFields: {
                    totalCount: { $ifNull: [{ $arrayElemAt: ['$stats.total', 0] }, 0] },
                    todayCount: { $ifNull: [{ $arrayElemAt: ['$stats.today', 0] }, 0] },
                },
            },
            { $project: { stats: 0 } },
            { $sort: { totalCount: -1, slug: 1 } },
            { $skip: skip },
            { $limit: limit },
        ];

        const countPipeline = [...basePipeline, { $count: 'count' }];

        const [result] = await Tag.aggregate([
            {
                $facet: {
                    items: itemsPipeline,
                    totalCount: countPipeline,
                },
            },
        ]);

        const total = result?.totalCount?.[0]?.count || 0;

        return {
            items: result?.items || [],
            total,
        };
    }
}

export default new TagRepository();
