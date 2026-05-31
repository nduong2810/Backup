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

const VN_TZ_OFFSET_MIN = 7 * 60;

const getTodayStart = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnNow = new Date(utcMs + VN_TZ_OFFSET_MIN * 60000);
    const vnStart = new Date(vnNow);
    vnStart.setHours(0, 0, 0, 0);
    const vnStartUtcMs = vnStart.getTime() - VN_TZ_OFFSET_MIN * 60000;
    return new Date(vnStartUtcMs);
};

const includesUserId = (items = [], userId = '') => {
    if (!userId || !Array.isArray(items)) return false;
    return items.some((id) => String(id) === String(userId));
};

const getUserVote = (post, userId) => {
    if (!userId || !post) return null;
    if (includesUserId(post.upvotes, userId)) return 'upvote';
    if (includesUserId(post.downvotes, userId)) return 'downvote';
    return null;
};

class PostService {

    // ==================== API 0: LẤY DANH SÁCH BÀI VIẾT ====================
    async getPosts(query, userId = null) {
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

        const filter = { status: { $ne: 'deleted' } };

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
            const mappedStatus = mapStatusFilter(status);
            filter.status = mappedStatus;
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
                upvotes: post.upvoteCount ?? 0,
                downvotes: post.downvoteCount ?? 0,
                upvoteCount: post.upvoteCount ?? 0,
                downvoteCount: post.downvoteCount ?? 0,
                userVote: getUserVote(post, userId),
                status: statusValue,
                views: post.viewCount ?? 0,
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
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        if (post.status === 'deleted') {
            throw { status: 410, message: 'Bài viết đã bị xóa' };
        }

        if (incrementView) {
            const todayStart = getTodayStart();
            const sameDay = post.dailyViewDate && post.dailyViewDate.getTime() === todayStart.getTime();
            await postRepository.incrementViewCount(postId, {
                resetDaily: !sameDay,
                todayStart,
            });
        }

        const comments = await commentRepository.findByPostId(postId);
        const commentCount = await commentRepository.countByPostId(postId);
        const commentTree = this._buildCommentTree(comments);

        const userVote = getUserVote(post, userId);

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

    async createComment(postId, userId, payload) {
        const content = String(payload.content || '').trim();
        const parentComment = payload.parentComment || null;

        if (!content) {
            throw { status: 400, message: 'Nội dung bình luận không được để trống' };
        }

        if (content.length > 2000) {
            throw { status: 400, message: 'Nội dung bình luận tối đa 2000 ký tự' };
        }

        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        if (post.status !== 'active') {
            throw { status: 400, message: 'Không thể bình luận trên bài viết này' };
        }

        if (parentComment) {
            const parent = await commentRepository.findById(parentComment);
            if (!parent) {
                throw { status: 404, message: 'Bình luận cha không tồn tại' };
            }

            if (String(parent.post?._id || parent.post) !== String(postId)) {
                throw { status: 400, message: 'Bình luận cha không thuộc bài viết này' };
            }
        }

        return await commentRepository.create({
            content,
            author: userId,
            post: postId,
            parentComment,
        });
    }

    // ==================== API 2: XỬ LÝ VOTE ====================
    async toggleVote(postId, userId, voteType) {
        const post = await postRepository.findById(postId);
        if (!post) {
            throw { status: 404, message: 'Bài viết không tồn tại' };
        }

        if (post.status !== 'active') {
            throw { status: 400, message: 'Không thể vote bài viết này' };
        }

        const hasUpvoted = includesUserId(post.upvotes, userId);
        const hasDownvoted = includesUserId(post.downvotes, userId);

        let userVote = null;
        const todayStart = getTodayStart();
        const dailyUpdates = {};
        const applyDailyUpdate = (countField, dateField, delta, currentDate, currentCount) => {
            if (!delta) return;
            const sameDay = currentDate && currentDate.getTime() === todayStart.getTime();
            if (sameDay) {
                dailyUpdates[countField] = Math.max(0, (currentCount ?? 0) + delta);
                dailyUpdates[dateField] = todayStart;
                return;
            }
            if (delta > 0) {
                dailyUpdates[countField] = 1;
                dailyUpdates[dateField] = todayStart;
            }
        };

        if (voteType === 'upvote') {
            if (hasUpvoted) {
                await postRepository.removeUpvote(postId, userId);
                userVote = null;
                applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', -1, post.dailyUpvoteDate, post.dailyUpvoteCount);
            } else {
                if (hasDownvoted) {
                    await postRepository.removeDownvote(postId, userId);
                    applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', -1, post.dailyDownvoteDate, post.dailyDownvoteCount);
                }
                await postRepository.addUpvote(postId, userId);
                userVote = 'upvote';
                applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', 1, post.dailyUpvoteDate, post.dailyUpvoteCount);
            }
        } else if (voteType === 'downvote') {
            if (hasDownvoted) {
                await postRepository.removeDownvote(postId, userId);
                userVote = null;
                applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', -1, post.dailyDownvoteDate, post.dailyDownvoteCount);
            } else {
                if (hasUpvoted) {
                    await postRepository.removeUpvote(postId, userId);
                    applyDailyUpdate('dailyUpvoteCount', 'dailyUpvoteDate', -1, post.dailyUpvoteDate, post.dailyUpvoteCount);
                }
                await postRepository.addDownvote(postId, userId);
                userVote = 'downvote';
                applyDailyUpdate('dailyDownvoteCount', 'dailyDownvoteDate', 1, post.dailyDownvoteDate, post.dailyDownvoteCount);
            }
        }

        if (Object.keys(dailyUpdates).length > 0) {
            await postRepository.updateDailyVoteStats(postId, dailyUpdates);
        }

        const updatedPost = await postRepository.findById(postId);

        return {
            postId: updatedPost._id,
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
            postRepository.findPopularTags(5),
        ]);

        return {
            hotQuestions: hotQuestions.map((item) => ({
                id: item._id,
                title: item.title,
            })),
            popularTags,
        };
    }

    async getTrendingToday(query = {}) {
        const limitNum = Math.min(20, Math.max(1, parseInt(query.limit, 10) || 10));
        const todayStart = getTodayStart();
        const posts = await postRepository.findTrendingToday(todayStart, limitNum);

        return posts.map((post) => ({
            ...post,
            viewsToday: post.dailyViewCount ?? 0,
            views: post.viewCount ?? 0,
        }));
    }

    async getTopUpvoted(query = {}) {
        const limitNum = Math.min(20, Math.max(1, parseInt(query.limit, 10) || 10));
        const todayStart = getTodayStart();
        const posts = await postRepository.findTopUpvoted(todayStart, limitNum);

        return posts.map((post) => ({
            ...post,
            upvotesToday: post.dailyUpvoteCount ?? 0,
            upvoteCount: post.upvoteCount ?? 0,
            downvoteCount: post.downvoteCount ?? 0,
            views: post.viewCount ?? 0,
        }));
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