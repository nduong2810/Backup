import SystemSetting from '../model/systemSetting.model.js';

export const seedSystemSettings = async () => {
  try {
    const defaultSettings = [
      {
        key: 'reputation_daily_cap',
        value: 200,
        description: 'Giới hạn số điểm danh tiếng (Reputation) tối đa thành viên nhận được từ upvote trong một ngày.'
      },
      {
        key: 'flag_auto_hide_threshold',
        value: 5,
        description: 'Số lượng cờ báo cáo vi phạm tối thiểu để bài đăng tự động chuyển sang trạng thái ẩn (hidden).'
      },
      {
        key: 'reputation_upvote_score',
        value: 10,
        description: 'Số điểm danh tiếng cộng cho tác giả khi nhận được 1 Upvote bài viết.'
      },
      {
        key: 'reputation_downvote_score',
        value: -2,
        description: 'Số điểm danh tiếng trừ đối với tác giả khi bị 1 Downvote bài viết.'
      }
    ];

    for (const setting of defaultSettings) {
      const exists = await SystemSetting.findOne({ key: setting.key });
      if (!exists) {
        await SystemSetting.create(setting);
        console.log(`🌱 [Seed] Đã khởi tạo cài đặt hệ thống: ${setting.key} = ${setting.value}`);
      }
    }
    // Migration để chuẩn hóa ngày danh tiếng theo múi giờ mới
    try {
      const User = (await import('../model/user.model.js')).default;
      const { getTodayStart } = await import('../service/reputation.service.js');
      const todayStart = getTodayStart();
      const migrateResult = await User.updateMany(
        { reputationDailyDate: { $exists: true, $ne: null } },
        { $set: { reputationDailyDate: todayStart } }
      );
    } catch (migErr) {
      console.error('❌ Lỗi chạy migration chuẩn hóa ngày:', migErr);
    }
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo cài đặt hệ thống:', error);
  }
};
