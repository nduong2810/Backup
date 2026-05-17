import postRepository from '../repository/post.repository.js'

class PostService {
  async getPosts(query) {
    const {
      keyword = '',
      tags = '',
      status = 'All',
      sortBy = 'Newest',
      minViews = '',
      minUpvotes = '',
      page = 1,
      limit = 15,
    } = query

    const filter = {}

    if (keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i')
      filter.$or = [{ title: regex }, { content: regex }]
    }

    if (tags.trim()) {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      if (tagArray.length > 0) {
        filter.tags = { $in: tagArray }
      }
    }

    if (status && status !== 'All') {
      filter.status = status.toLowerCase()
    }

    if (minViews !== '' && !isNaN(Number(minViews))) {
      filter.views = { ...filter.views, $gte: Number(minViews) }
    }

    if (minUpvotes !== '' && !isNaN(Number(minUpvotes))) {
      filter.upvotes = { ...filter.upvotes, $gte: Number(minUpvotes) }
    }

    let sort = {}
    switch (sortBy) {
      case 'MostViewed':
        sort = { views: -1 }
        break
      case 'MostUpvoted':
        sort = { upvotes: -1 }
        break
      case 'Newest':
      default:
        sort = { createdAt: -1 }
        break
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15))
    const skip = (pageNum - 1) * limitNum

    const [posts, total] = await Promise.all([
      postRepository.findPosts(filter, sort, skip, limitNum),
      postRepository.countPosts(filter),
    ])

    return {
      data: posts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }
  }
}

export default new PostService()
