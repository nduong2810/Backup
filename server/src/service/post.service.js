import postRepository from '../repository/post.repository.js';
import commentRepository from '../repository/comment.repository.js';

// ====================================================================
// POST SERVICE - Tầng Business Logic cho bài viết
// Xử lý nghiệp vụ: xem chi tiết, vote, bài viết liên quan, lọc danh sách
// ====================================================================

const mapStatusFilter = (status) => {
    const normalized = status.toLowerCase();
    if (normalized === 'resolved') return 'closed';
    if (normalized === 'unresolved') return 'active';
    return normalized;
};

class PostService {

    // ==================== API 0: LẤY DANH SÁCH BÀI VIẾT ====================
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
        } = query;

        const filter = {};

        if (keyword.trim()) {
            const regex = new RegExp(keyword.trim(), 'i');
            filter.$or = [{ title: regex }, { content: regex }];
        }

        if (tags.trim()) {
            const tagArray = tags
                .split(',')
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);
            if (tagArray.length > 0) {
                filter.tags = { $in: tagArray };
            }
        }

        if (status && status !== 'All') {
            filter.status = mapStatusFilter(status);
        }

        if (minViews !== '' && !isNaN(Number(minViews))) {
            filter.viewCount = { ...filter.viewCount, $gte: Number(minViews) };
        }

        if (minUpvotes !== '' && !isNaN(Number(minUpvotes))) {
            filter.$expr = {
                $gte: [
                    {
                        $cond: [
                            { $isArray: '$upvotes' },
                            { $size: { $ifNull: ['$upvotes', []] } },
                            { $ifNull: ['$upvotes', 0] },
                        ],
                    },
                    Number(minUpvotes),
                ],
            };
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            postRepository.findPostsForList(filter, sortBy, skip, limitNum),
            postRepository.countPosts(filter),
        ]);

        const normalizedPosts = posts.map((post) => {
            const statusValue = post.status === 'closed'
                ? 'resolved'
                : post.status === 'active'
                    ? 'unresolved'
                    : post.status;

            return {
                ...post,
                status: statusValue,
                views: post.viewCount ?? 0,
                upvotes: post.upvoteCount ?? 0,
                downvotes: post.downvoteCount ?? 0,
                answerCount: post.answerCount ?? 0,
            };
        });

        return {
            data: normalizedPosts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    // ==================== API 1: LẤY CHI TIẾT BÀI VIẾT ====================
    async getPostDetail(postId, userId = null, incrementView = true) {
        // 1. Tìm bài viết theo ID
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        // 2. Kiểm tra bài viết đã bị xóa chưa
        if (post.status === 'deleted') {
            throw { status: 410, message: 'Bài viết đã bị xóa' };
        }

        // 3. Tăng lượt xem (+1)
        if (incrementView) {
            await postRepository.incrementViewCount(postId);
        }

        // 4. Lấy danh sách comments + tổng số comment
        const comments = await commentRepository.findByPostId(postId);
        const commentCount = await commentRepository.countByPostId(postId);

        // 5. Xây dựng cây comment (nested replies)
        const commentTree = this._buildCommentTree(comments);

        // 6. Trả về dữ liệu đầy đủ
        let userVote = null;
        if (userId) {
            const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
            const hasDownvoted = post.downvotes.some(id => id.toString() === userId);
            if (hasUpvoted) userVote = 'upvote';
            else if (hasDownvoted) userVote = 'downvote';
        }

        return {
            post: {
                ...post.toObject(),
                viewCount: post.viewCount + (incrementView ? 1 : 0),
                userVote,
            },
            comments: commentTree,
            commentCount,
        };
    }

    // ==================== API 2: XỬ LÝ VOTE ====================
    async toggleVote(postId, userId, voteType) {
        // 1. Kiểm tra bài viết tồn tại
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        if (post.status !== 'active') {
            throw { status: 400, message: 'Không thể vote bài viết này' };
        }

        // 2. Kiểm tra trạng thái vote hiện tại của user
        const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
        const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

        let userVote = null;

        if (voteType === 'upvote') {
            if (hasUpvoted) {
                await postRepository.removeUpvote(postId, userId);
                userVote = null;
            } else {
                if (hasDownvoted) {
                    await postRepository.removeDownvote(postId, userId);
                }
                await postRepository.addUpvote(postId, userId);
                userVote = 'upvote';
            }
        } else if (voteType === 'downvote') {
            if (hasDownvoted) {
                await postRepository.removeDownvote(postId, userId);
                userVote = null;
            } else {
                if (hasUpvoted) {
                    await postRepository.removeUpvote(postId, userId);
                }
                await postRepository.addDownvote(postId, userId);
                userVote = 'downvote';
            }
        }

        const updatedPost = await postRepository.findById(postId);

        return {
            upvoteCount: updatedPost.upvotes.length,
            downvoteCount: updatedPost.downvotes.length,
            userVote,
        };
    }

    // ==================== API 3: BÀI VIẾT LIÊN QUAN ====================
    async getRelatedPosts(tag, excludePostId) {
        if (!tag || tag.trim() === '') {
            throw { status: 400, message: 'Tag không được để trống' };
        }

        return await postRepository.findRelatedByTag(
            tag.toLowerCase().trim(),
            excludePostId,
            5
        );
    }

    async getPostDetailSidebarData() {
        const [hotQuestions, popularTags] = await Promise.all([
            postRepository.findHotNetworkQuestions(10),
            postRepository.findPopularTags(8),
        ]);

        return {
            hotQuestions: hotQuestions.map((item) => ({
                id: item._id,
                title: item.title,
            })),
            popularTags,
        };
    }

    // ==================== HELPER: Xây dựng cây comment ====================
    _buildCommentTree(comments) {
        const commentMap = {};
        const rootComments = [];

        comments.forEach(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = [];
            commentMap[commentObj._id.toString()] = commentObj;
        });

        comments.forEach(comment => {
            const commentObj = commentMap[comment._id.toString()];
            if (comment.parentComment) {
                const parentId = comment.parentComment.toString();
                if (commentMap[parentId]) {
                    commentMap[parentId].replies.push(commentObj);
                }
            } else {
                rootComments.push(commentObj);
            }
        });

        return rootComments;
    }
}

export default new PostService();
