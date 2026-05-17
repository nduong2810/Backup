import postService from '../service/post.service.js'

export const getPosts = async (req, res) => {
  try {
    const result = await postService.getPosts(req.query)

    // Trả về response
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[PostController] getPosts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài đăng',
    })
  }
}
