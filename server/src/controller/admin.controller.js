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

class AdminController {
    async getDashboardStats(req, res) {
        try {
            // 1. Chỉ số nhanh (Counters)
            const [
                totalUsers,
                totalPosts,
                totalComments,
                completedDonationsAgg,
                pendingDonationsCount,
                pendingFlagsCount,
            ] = await Promise.all([
                User.countDocuments(),
                Post.countDocuments({ status: { $ne: 'deleted' } }),
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

            // 2. Lấy dữ liệu timeline (6 tháng gần nhất)
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 5);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const [userTimeline, postTimeline, donationTimeline] = await Promise.all([
                User.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Post.aggregate([
                    { $match: { status: { $ne: 'deleted' }, createdAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                DonationTransaction.aggregate([
                    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            amount: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
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

            // 3. Phân bố bài viết theo loại và tỷ lệ phản hồi bài viết
            const [postTypes, activePostIdsWithComments] = await Promise.all([
                Post.aggregate([
                    { $match: { status: { $ne: 'deleted' } } },
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
                status: { $ne: 'deleted' }
            });
            const postsWithoutCommentsCount = Math.max(0, totalPosts - postsWithCommentsCount);

            // 4. Danh sách 5 báo cáo vi phạm gần nhất
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
                    if (elapsed >= THIRTY_MINUTES_MS) {
                        status = 'received';
                    }
                }
                return {
                    ...ticket,
                    status,
                    flagTypeLabel: FLAG_LABELS[ticket.flagType] || ticket.flagType,
                    statusLabel: STATUS_LABELS[status] || status,
                };
            });

            // 5. Danh sách 5 bill COD thành công gần nhất
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
}

export default new AdminController();
