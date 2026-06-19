import mongoose from 'mongoose';
import User from '../model/user.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import ReportTicket from '../model/reportTicket.model.js';
import SystemSetting from '../model/systemSetting.model.js';
import Tag from '../model/tag.model.js';

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
            const vnTime = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
            const vnStartUtc = Date.UTC(vnTime.getUTCFullYear(), vnTime.getUTCMonth(), vnTime.getUTCDate(), 0, 0, 0, 0);
            startDate.setTime(vnStartUtc - 7 * 60 * 60 * 1000);

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

    async createTag(req, res) {
        try {
            const { name, description } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, message: 'Tên thẻ tag không được để trống' });
            }

            const slug = name.trim().toLowerCase();
            const existingTag = await Tag.findOne({ slug });
            if (existingTag) {
                return res.status(400).json({ success: false, message: 'Thẻ tag này đã tồn tại' });
            }

            const newTag = await Tag.create({
                name: name.trim(),
                slug,
                description: (description || '').trim()
            });

            return res.status(201).json({
                success: true,
                message: 'Tạo thẻ tag thành công',
                data: newTag
            });
        } catch (error) {
            console.error('[AdminController] createTag error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi tạo thẻ tag' });
        }
    }

    async updateTag(req, res) {
        try {
            const tagObjectId = getObjectId(req.params.tagId);
            if (!tagObjectId) {
                return res.status(400).json({ success: false, message: 'ID thẻ tag không hợp lệ' });
            }

            const { name, description } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, message: 'Tên thẻ tag không được để trống' });
            }

            const slug = name.trim().toLowerCase();
            const existingTag = await Tag.findOne({ slug, _id: { $ne: tagObjectId } });
            if (existingTag) {
                return res.status(400).json({ success: false, message: 'Tên thẻ tag đã được sử dụng bởi thẻ khác' });
            }

            const oldTag = await Tag.findById(tagObjectId);
            if (!oldTag) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ tag' });
            }

            const updatedTag = await Tag.findByIdAndUpdate(
                tagObjectId,
                {
                    $set: {
                        name: name.trim(),
                        slug,
                        description: (description || '').trim()
                    }
                },
                { new: true }
            );

            if (oldTag.slug !== slug) {
                await Post.updateMany(
                    { tags: oldTag.slug },
                    { $set: { "tags.$[elem]": slug } },
                    { arrayFilters: [{ elem: oldTag.slug }] }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Cập nhật thẻ tag thành công',
                data: updatedTag
            });
        } catch (error) {
            console.error('[AdminController] updateTag error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thẻ tag' });
        }
    }

    async deleteTag(req, res) {
        try {
            const tagObjectId = getObjectId(req.params.tagId);
            if (!tagObjectId) {
                return res.status(400).json({ success: false, message: 'ID thẻ tag không hợp lệ' });
            }

            const tag = await Tag.findById(tagObjectId);
            if (!tag) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ tag' });
            }

            // Kiểm tra xem thẻ tag có đang được bài viết nào sử dụng không
            const postCount = await Post.countDocuments({ tags: tag.slug });
            if (postCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể xóa thẻ tag này vì đang có ${postCount} bài viết sử dụng.`
                });
            }

            await Tag.findByIdAndDelete(tagObjectId);

            return res.status(200).json({
                success: true,
                message: 'Xóa thẻ tag thành công'
            });
        } catch (error) {
            console.error('[AdminController] deleteTag error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi xóa thẻ tag' });
        }
    }

    // ==================== ADMIN USER MANAGEMENT ====================

    async getManagedUsers(req, res) {
        try {
            const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
            const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 10));
            const keyword = String(req.query.keyword || '').trim();
            const status = String(req.query.status || 'all').trim().toLowerCase();
            const skip = (page - 1) * limit;

            // Chỉ load user thường (role='user'), không load admin
            const match = { role: 'user' };

            if (keyword) {
                const regex = { $regex: escapeRegex(keyword), $options: 'i' };
                match.$or = [{ fullName: regex }, { email: regex }];
            }

            if (status === 'active') match.isActive = true;
            else if (status === 'locked') match.isActive = false;

            const pipeline = [
                { $match: match },
                {
                    $facet: {
                        items: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    fullName: 1,
                                    email: 1,
                                    avatar: 1,
                                    major: 1,
                                    reputation: 1,
                                    isActive: 1,
                                    createdAt: 1,
                                },
                            },
                        ],
                        total: [{ $count: 'count' }],
                    },
                },
            ];

            const [result] = await User.aggregate(pipeline);
            const users = result?.items || [];
            const total = result?.total?.[0]?.count || 0;

            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.max(1, Math.ceil(total / limit)),
                    },
                },
            });
        } catch (error) {
            console.error('[AdminController] getManagedUsers error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Không thể tải danh sách thành viên',
            });
        }
    }

    async getUserDetail(req, res) {
        try {
            const userObjectId = getObjectId(req.params.userId);
            if (!userObjectId) {
                return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
            }

            const user = await User.findById(userObjectId)
                .select('-password -otp -otpExpiry -resetOTP -resetOTPExpiry -resetToken')
                .lean();

            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
            }

            // Thống kê hoạt động của user
            const [postCount, commentCount, reportCount] = await Promise.all([
                Post.countDocuments({ author: userObjectId }),
                Comment.countDocuments({ author: userObjectId }),
                ReportTicket.countDocuments({ post: { $in: await Post.find({ author: userObjectId }).distinct('_id') } }),
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    user,
                    stats: {
                        postCount,
                        commentCount,
                        reportCount,
                    },
                },
            });
        } catch (error) {
            console.error('[AdminController] getUserDetail error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Không thể tải thông tin thành viên',
            });
        }
    }

    async toggleUserStatus(req, res) {
        try {
            const userObjectId = getObjectId(req.params.userId);
            if (!userObjectId) {
                return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
            }

            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
            }

            // Không cho phép admin tự khóa chính mình
            if (String(userObjectId) === String(req.user.userId)) {
                return res.status(400).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản của chính bạn' });
            }

            const targetUser = await User.findById(userObjectId).select('role fullName isActive');
            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
            }

            // Không cho phép thao tác trên tài khoản admin khác (phòng thủ thêm)
            if (targetUser.role === 'admin') {
                return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản quản trị viên' });
            }

            targetUser.isActive = isActive;
            await targetUser.save();

            const statusMessage = isActive
                ? `Đã mở khóa tài khoản "${targetUser.fullName}"`
                : `Đã khóa tài khoản "${targetUser.fullName}"`;

            return res.status(200).json({
                success: true,
                message: statusMessage,
                data: {
                    _id: targetUser._id,
                    isActive: targetUser.isActive,
                },
            });
        } catch (error) {
            console.error('[AdminController] toggleUserStatus error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Không thể cập nhật trạng thái thành viên',
            });
        }
    }
}

export default new AdminController();
