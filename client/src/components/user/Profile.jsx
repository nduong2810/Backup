import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import ReputationBadge, { getRankInfo } from '../ui/ReputationBadge';
import {
  fetchProfileThunk,
  setProfileField,
  updateProfileThunk,
  clearProfileMessages,
} from '../../store/slices/profileSlice';
import { useToast } from '../../context/ToastContext';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, reputationInfo, loading, saving, successMessage, errorMessage, errorStatus } = useSelector((state) => state.profile);
  const { toast } = useToast();

  const bioCount = useMemo(() => `${form.bio.length}/500`, [form.bio]);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (errorStatus === 401) {
      navigate('/auth/login', { replace: true });
    }
  }, [errorStatus, navigate]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProfileMessages());
    }
  }, [successMessage, toast, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearProfileMessages());
    }
  }, [errorMessage, toast, dispatch]);

  if (loading) {
    return (
      <AppCard title="Hồ sơ cá nhân" subtitle="Đang tải dữ liệu...">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </AppCard>
    );
  }

  // Tính progress đến rank tiếp theo
  const reputation = reputationInfo?.reputation || 1;
  const rank = reputationInfo || getRankInfo(reputation);
  const nextRank = rank.next;
  const progressPct = nextRank
    ? Math.min(100, Math.round(((reputation - rank.minRep) / (nextRank.minRep - rank.minRep)) * 100))
    : 100;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setProfileField({ field: 'avatar', value: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAvatar = () => {
    dispatch(setProfileField({ field: 'avatar', value: 'default-avatar.png' }));
  };

  const avatarUrl = form.avatar && form.avatar !== 'default-avatar.png'
    ? form.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName || 'U')}&background=0066cc&color=fff&size=120`;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Reputation Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Điểm uy tín</div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{reputation}</span>
              <ReputationBadge reputation={reputation} size="md" showLabel />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">
              {nextRank
                ? <>{nextRank.minRep - reputation} điểm nữa để lên <strong>{nextRank.name}</strong></>
                : <span className="text-amber-600 font-semibold">Cấp bậc tối cao 🏆</span>
              }
            </div>
          </div>
        </div>
        {nextRank && (
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: rank.color }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>{rank.name}</span>
              <span>{nextRank.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <AppCard title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin để cộng đồng dễ kết nối hơn">

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch(updateProfileThunk());
          }}
        >
          {/* Avatar Change Area */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100 dark:border-outline-variant">
            <div className="relative group cursor-pointer w-24 h-24">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={saving}
                />
              </label>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800 dark:text-inverse-on-surface">Ảnh đại diện</div>
              <div className="text-xs text-slate-400 mt-0.5">Nhấp vào ảnh để thay đổi</div>
              {form.avatar && form.avatar !== 'default-avatar.png' && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors block mx-auto"
                >
                  Xóa ảnh đại diện
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Họ và tên"
              name="fullName"
              value={form.fullName}
              onChange={(event) => dispatch(setProfileField({ field: 'fullName', value: event.target.value }))}
              required
              disabled={saving}
            />
            <InputField label="Email" name="email" value={form.email} onChange={() => { }} disabled />
            <InputField
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={(event) => dispatch(setProfileField({ field: 'phone', value: event.target.value }))}
              placeholder="VD: 09xxxxxxxx"
              disabled={saving}
            />
            <InputField
              label="Chuyên ngành / Công việc"
              name="major"
              value={form.major}
              onChange={(event) => dispatch(setProfileField({ field: 'major', value: event.target.value }))}
              placeholder="Kỹ thuật phần mềm"
              disabled={saving}
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Bio</span>
            <textarea
              name="bio"
              value={form.bio}
              onChange={(event) => dispatch(setProfileField({ field: 'bio', value: event.target.value }))}
              maxLength={500}
              rows={4}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Giới thiệu ngắn về bạn, kỹ năng, mảng quan tâm..."
            />
            <p className="mt-1 text-right text-xs text-slate-500">{bioCount}</p>
          </label>

          <AppButton type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </AppButton>
        </form>
      </AppCard>
    </div>
  );
}
