import mongoose from 'mongoose';
import User from '../model/user.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReportTicket from '../model/reportTicket.model.js';
import SystemSetting from '../model/systemSetting.model.js';

const FLAG_LABELS = {
  spam: 'Spam',
  rude_abusive: 'Công kích/Xúc phạm',
  off_topic: 'Lạc chủ đề',
  needs_detail: 'Cần thêm chi tiết',
  needs_focus: 'Cần tập trung',
  opinion_based: 'Quan điểm cá nhân',
  duplicate: 'Trùng lặp',
  very_low_quality: 'Chất lượng thấp',
  moderator_attention: 'Cần moderator',
};

const STATUS_LABELS = {
  submitted: 'Mới gửi',
  received: 'Đã tiếp nhận',
  in_review: 'Đang xem xét',
  action_taken: 'Đã xử lý vi phạm',
  closed: 'Đã đóng (không xử lý)',
  retracted: 'Đã rút cờ',
};

const POST_STATUS_VALUES = ['active', 'closed', 'hidden', 'deleted'];
const PUBLIC_POST_MATCH = { status: { $nin: ['hidden', 'deleted'] } };

const POST_STATUS_MESSAGES = {
  active: 'Bài viết đang hiển thị',
  closed: 'Bài viết đã bị khóa',
  hidden: 'Bài viết đang bị ẩn',
  deleted: 'Bài viết đã bị xóa',
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(String(value || '').trim())) return null;
  return new mongoose.Types.ObjectId(String(value).trim());
};

class AdminController {
    async getDashboardStats(req, res) {
        try {
            const [
                totalUsers,
                totalPosts,
                totalComments,
                completedDonationsAgg,
                pendingDonationsCount,
                pendingFlagsCount,
            ] = await Promise.all([
                User.countDocuments(),
                Post.countDocuments(PUBLIC_POST_MATCH),
                Comment.countDocuments(),
                DonationTransaction.aggregate([
                    { $match: { status: 'completed' } },
                    { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
                ]),
                DonationTransaction.countDocuments({ status: 'pending_review', paymentMethod: 'cod' }),
                ReportTicket.countDocuments({ status: { $in: ['submitted', 'received', 'in_review'] } }),
            ]);

            const totalDonationAmount = completedDonationsAgg[0]?.totalAmount || 0;
            const totalDonationsCount = completedDonationsAgg[0]?.count || 0;

            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 5);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const [userTimeline, postTimeline, donationTimeline] = await Promise.all([
                User.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }
                ]),
                Post.aggregate([
                    { $match: { ...PUBLIC_POST_MATCH, createdAt: { $gte: startDate } } },
                    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }
                ]),
                DonationTransaction.aggregate([
                    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
                    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
                ])
            ]);

            const now = new Date();
            const timeline = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const userEntry = userTimeline.find(t => t._id.year === year && t._id.month === month);
                const postEntry = postTimeline.find(t => t._id.year === year && t._id.month === month);
                const donationEntry = donationTimeline.find(t => t._id.year === year && t._id.month === month);
                timeline.push({
                    year,
                    month,
                    label: `T${month}/${year}`,
                    users: userEntry?.count || 0,
                    posts: postEntry?.count || 0,
                    donationAmount: donationEntry?.amount || 0,
                    donationCount: donationEntry?.count || 0,
                });
            }

            const [postTypes, activePostIdsWithComments] = await Promise.all([
                Post.aggregate([
                    { $match: PUBLIC_POST_MATCH },
                    { $group: { _id: '$postType', count: { $sum: 1 } } }
                ]),
                Comment.distinct('post'),
            ]);

            const postTypeDist = postTypes.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { question: 0, advice: 0 });

            const postsWithCommentsCount = await Post.countDocuments({
                _id: { $in: activePostIdsWithComments },
                ...PUBLIC_POST_MATCH,
            });
            const postsWithoutCommentsCount = Math.max(0, totalPosts - postsWithCommentsCount);

            const rawRecentFlags = await ReportTicket.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('reporter', 'fullName email')
                .populate('post', 'title')
                .lean();

            const THIRTY_MINUTES_MS = 30 * 60 * 1000;
            const recentFlags = rawRecentFlags.map(ticket => {
                let status = ticket.status;
                if (status === 'submitted') {
                    const elapsed = Date.now() - new Date(ticket.createdAt).getTime();
                    if (elapsed >= THIRTY_MINUTES_MS) status = 'received';
                }
                return {
                    ...ticket,
                    status,
                    flagTypeLabel: FLAG_LABELS[ticket.flagType] || ticket.flagType,
                    statusLabel: STATUS_LABELS[status] || status,
                };
            });

            const recentDonations = await DonationTransaction.find({ status: 'completed' })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('donor', 'fullName email')
                .populate('author', 'fullName')
                .lean();

            res.status(200).json({
                success: true,
                data: {
                    summary: {
                        totalUsers,
                        totalPosts,
                        totalComments,
                        totalDonationAmount,
                        totalDonationsCount,
                        pendingDonationsCount,
                        pendingFlagsCount,
                    },
                    timeline,
                    distributions: {
                        postType: postTypeDist,
                        postResponse: {
                            answered: postsWithCommentsCount,
                            unanswered: postsWithoutCommentsCount,
                        },
                    },
                    recentFlags,
                    recentDonations,
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi tải số liệu thống kê quản trị'
            });
        }
    }

    async getSystemSettings(req, res) {
        try {
            const settings = await SystemSetting.find({});
            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi tải cấu hình hệ thống'
            });
        }
    }

    async getManagedPosts(req, res) {
        try {
            const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
            const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 10));
            const keyword = String(req.query.keyword || '').trim();
            const status = String(req.query.status || 'all').trim().toLowerCase();
            const skip = (page - 1) * limit;

            const match = {};
            if (keyword) match.title = { $regex: escapeRegex(keyword), $options: 'i' };
            if (POST_STATUS_VALUES.includes(status)) match.status = status;

            const pipeline = [
                { $match: match },
                {
                    $addFields: {
                        upvoteCount: { $cond: [{ $isArray: '$upvotes' }, { $size: '$upvotes' }, 0] },
                        downvoteCount: { $cond: [{ $isArray: '$downvotes' }, { $size: '$downvotes' }, 0] },
                    },
                },
                {
                    $lookup: {
                        from: 'comments',
                        let: { postId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$post', '$$postId'] } } },
                            { $count: 'count' },
                        ],
                        as: 'commentMeta',
                    },
                },
                { $addFields: { commentCount: { $ifNull: [{ $arrayElemAt: ['$commentMeta.count', 0] }, 0] } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDoc',
                    },
                },
                { $unwind: { path: '$authorDoc', preserveNullAndEmptyArrays: true } },
                {
                    $facet: {
                        items: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    title: 1,
                                    status: 1,
                                    postType: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    viewCount: 1,
                                    upvoteCount: 1,
                                    downvoteCount: 1,
                                    commentCount: 1,
                                    tags: 1,
                                    author: {
                                        _id: '$authorDoc._id',
                                        fullName: '$authorDoc.fullName',
                                        email: '$authorDoc.email',
                                        avatar: '$authorDoc.avatar',
                                    },
                                    authorLabel: {
                                        $ifNull: ['$authorDoc.fullName', { $ifNull: ['$authorDoc.email', 'Không rõ tác giả'] }],
                                    },
                                },
                            },
                        ],
                        total: [{ $count: 'count' }],
                    },
                },
            ];

            const [result] = await Post.aggregate(pipeline);
            const posts = result?.items || [];
            const total = result?.total?.[0]?.count || 0;

            return res.status(200).json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.max(1, Math.ceil(total / limit)),
                    },
                },
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Không thể tải danh sách bài viết',
            });
        }
    }

    async updateSystemSetting(req, res) {
        try {
            const { key, value } = req.body;
            if (!key) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu tham số key'
                });
            }

            const setting = await SystemSetting.findOneAndUpdate(
                { key },
                { value },
                { new: true }
            );

            if (!setting) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy cấu hình với key: ${key}`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật cấu hình thành công',
                data: setting
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi cập nhật cấu hình hệ thống'
            });
        }
    }

    async updatePostStatus(req, res) {
        try {
            const postObjectId = getObjectId(req.params.postId);
            const status = String(req.body.status || '').trim().toLowerCase();

            if (!postObjectId) {
                return res.status(400).json({ success: false, message: 'ID bài viết không hợp lệ' });
            }
            if (!POST_STATUS_VALUES.includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái bài viết không hợp lệ' });
            }

            const post = await Post.findByIdAndUpdate(
                postObjectId,
                { $set: { status } },
                { new: true }
            )
                .select('title status updatedAt')
                .lean();

            if (!post) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
            }

            return res.status(200).json({
                success: true,
                message: POST_STATUS_MESSAGES[status] || 'Đã cập nhật trạng thái bài viết',
                data: post,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Không thể cập nhật trạng thái bài viết',
            });
        }
    }
}

export default new AdminController();
