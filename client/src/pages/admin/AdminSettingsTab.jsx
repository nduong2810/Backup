import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSettingsThunk,
  updateSettingThunk,
  updateLocalInputValue,
  clearMessages
} from '../../store/slices/settingsSlice';

export default function AdminSettingsTab() {
  const dispatch = useDispatch();
  const { settings, loading, savingKey, successMsg, errorMsg } = useSelector(
    state => state.settings
  );

  useEffect(() => {
    dispatch(fetchSettingsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg, dispatch]);

  const handleUpdate = (key, val) => {
    let parsedVal = val;
    if (!isNaN(val) && val !== '') {
      parsedVal = Number(val);
    }
    dispatch(updateSettingThunk({ key, value: parsedVal }));
  };

  const handleInputChange = (key, val) => {
    dispatch(updateLocalInputValue({ key, value: val }));
  };

  const getSettingIcon = (key) => {
    switch (key) {
      case 'reputation_daily_cap':
        return 'military_tech';
      case 'flag_auto_hide_threshold':
        return 'brightness_alert';
      case 'reputation_upvote_score':
        return 'thumb_up';
      case 'reputation_downvote_score':
        return 'thumb_down';
      default:
        return 'settings';
    }
  };

  const getSettingTitle = (key) => {
    switch (key) {
      case 'reputation_daily_cap':
        return 'Hạn mức điểm danh tiếng nhận trong ngày (Daily Cap)';
      case 'flag_auto_hide_threshold':
        return 'Ngưỡng tự động ẩn bài đăng khi bị báo cáo (Flags)';
      case 'reputation_upvote_score':
        return 'Điểm cộng uy tín khi bài đăng nhận Upvote';
      case 'reputation_downvote_score':
        return 'Điểm trừ uy tín khi bài đăng bị Downvote';
      default:
        return key;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl font-bold">settings</span>
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cấu hình các thông số vận hành cốt lõi của diễn đàn IT Forum.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 transition-all animate-fade-in">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 transition-all">
          <span className="material-symbols-outlined text-rose-600">error</span>
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse p-6">
              <div className="h-6 w-1/3 bg-slate-200 rounded mb-4" />
              <div className="h-4 w-2/3 bg-slate-100 rounded mb-4" />
              <div className="h-10 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {settings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Không tìm thấy cài đặt nào trong cơ sở dữ liệu.
            </div>
          ) : (
            settings.map(setting => {
              const isSaving = savingKey === setting.key;
              const icon = getSettingIcon(setting.key);
              const title = getSettingTitle(setting.key);

              return (
                <section
                  key={setting.key}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 font-mono tracking-tight uppercase">
                        Key: {setting.key}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {setting.description || 'Chưa có mô tả chi tiết cho cấu hình này.'}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <div className="w-full sm:w-48">
                          <input
                            type="number"
                            value={setting.value ?? ''}
                            onChange={e => handleInputChange(setting.key, e.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdate(setting.key, setting.value)}
                          disabled={isSaving}
                          className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {isSaving ? (
                            <>
                              <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm font-bold">save</span>
                              Lưu lại
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })
          )}

          {/* Quick Informational Alert */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex gap-3.5">
            <span className="material-symbols-outlined text-primary text-xl font-bold shrink-0 mt-0.5">info</span>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">💡 Hướng dẫn cấu hình:</p>
              <ul className="list-disc list-inside mt-2 space-y-1.5 text-xs text-slate-600">
                <li><strong>Reputation Daily Cap:</strong> Khuyến nghị từ 100 đến 300 điểm/ngày để hạn chế chéo điểm gian lận.</li>
                <li><strong>Auto-hide Flag Threshold:</strong> Khuyến nghị từ 3 đến 8 cờ báo cáo. Số lượng cờ càng nhỏ thì bài viết vi phạm sẽ tự động ẩn càng nhanh.</li>
                <li><strong>Upvote Score:</strong> Khuyến nghị từ 5 đến 15 điểm (mặc định: 10). Giá trị cao hơn sẽ thúc đẩy người dùng đóng góp nhiều bài đăng chất lượng hơn.</li>
                <li><strong>Downvote Score:</strong> Khuyến nghị từ -5 đến -1 điểm (mặc định: -2). Nên là số âm để răn đe người dùng đăng bài viết kém chất lượng.</li>
                <li>Hệ thống lưu trữ các cài đặt này trực tiếp vào DB, sự thay đổi sẽ được áp dụng ngay lập tức mà không cần khởi động lại server.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
