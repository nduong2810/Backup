import Post from '../model/post.model.js'

class PostRepository {
  async findPosts(filter, sort, skip, limit) {
    return Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName avatar')
      .lean()
  }

  async countPosts(filter) {
    return Post.countDocuments(filter)
  }
}

export default new PostRepository()
