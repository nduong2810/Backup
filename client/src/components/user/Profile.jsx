import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
import UserStatistics from './statistics/UserStatistics';
import UserActivity from './statistics/UserActivity';
import { fetchStatisticsThunk } from '../../store/slices/statisticsSlice';
import { fetchPostsApi } from '../../services/postService';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    form,
    reputationInfo,
    createdAt,
    loading,
    saving,
    successMessage,
    errorMessage,
    errorStatus,
  } = useSelector((state) => state.profile);

  const { user } = useSelector((state) => state.login);
  const statsData = useSelector((state) => state.statistics.data);
  const [activeTab, setActiveTab] = useState('profile');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const bioCount = useMemo(() => `${form.bio.length}/500`, [form.bio]);
  const hasBankInfo = Boolean(form.bankName?.trim() && form.bankAccountNumber?.trim());

  useEffect(() => {
    dispatch(fetchProfileThunk());
    dispatch(fetchStatisticsThunk(12));
  }, [dispatch]);

  useEffect(() => {
    if (user?._id || user?.id) {
      const authorId = user._id || user.id;
      setLoadingPosts(true);
      fetchPostsApi({ authorId, limit: 10 })
        .then((response) => setUserPosts(response.data?.data || []))
        .catch((err) => console.error('[Profile] Error loading user posts:', err))
        .finally(() => setLoadingPosts(false));
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (errorStatus === 401) {
      navigate('/auth/login', { replace: true });
    }
  }, [errorStatus, navigate]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProfileMessages());
      setActiveTab('profile');
    }
  }, [successMessage, toast, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearProfileMessages());
    }
  }, [errorMessage, toast, dispatch]);

  const memberDays = useMemo(() => {
    if (!createdAt) return 1;
    const diffTime = Math.abs(Date.now() - new Date(createdAt));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [createdAt]);

  const reputation = reputationInfo?.reputation || 1;
  const rank = reputationInfo || getRankInfo(reputation);
  const nextRank = rank.next;
  const progressPct = nextRank
    ? Math.min(100, Math.round(((reputation - rank.minRep) / (nextRank.minRep - rank.minRep)) * 100))
    : 100;
  const dailyCap = reputationInfo?.dailyCap || 200;
  const dailyEarned = reputationInfo?.dailyEarned || 0;
  const dailyProgressPct = Math.min(100, Math.round((dailyEarned / dailyCap) * 100));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch(setProfileField({ field: 'avatar', value: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    dispatch(setProfileField({ field: 'avatar', value: 'default-avatar.png' }));
  };

  const avatarUrl = form.avatar && form.avatar !== 'default-avatar.png'
    ? form.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName || 'U')}&background=0066cc&color=fff&size=120`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="h-32 animate-pulse rounded-2xl bg-white border border-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full">
          <div className="relative group w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-800 truncate">
              {form.fullName || 'Người dùng'}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1.5 text-sm text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🍰</span>
                <span>Thành viên được {memberDays} ngày</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1.5 text-sm">
              <span className="font-bold text-slate-700">Uy tín: {reputation}</span>
              <ReputationBadge reputation={reputation} size="xs" showLabel />

              {nextRank && (
                <div className="flex items-center gap-2.5 sm:ml-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">{rank.name}</span>
                  <div className="h-2 w-24 sm:w-28 rounded-full bg-slate-100 overflow-hidden inline-block align-middle">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: rank.color }} />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase">{nextRank.name}</span>
                  <span className="text-xs text-slate-400">({nextRank.minRep - reputation} điểm nữa)</span>
                </div>
              )}
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1.5 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-slate-400">hourglass_top</span>
                <span>Hạn mức hôm nay: <span className="font-bold text-slate-700">{dailyEarned}/{dailyCap}</span> điểm từ vote</span>
              </div>
              <div className="h-1.5 w-24 sm:w-28 rounded-full bg-slate-100 overflow-hidden inline-block align-middle ml-1">
                <div className="h-full rounded-full transition-all duration-500 bg-sky-500" style={{ width: `${dailyProgressPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'edit' ? 'profile' : 'edit')}
          className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold shadow-sm transition-all shrink-0 ${activeTab === 'edit' ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <span className="material-symbols-outlined text-base">{activeTab === 'edit' ? 'close' : 'edit'}</span>
          {activeTab === 'edit' ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
        </button>
      </div>

      {activeTab !== 'edit' && (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mt-4">
          {[
            ['profile', 'Hồ sơ'],
            ['activity', 'Hoạt động'],
            ['statistics', 'Thống kê'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                dispatch(fetchProfileThunk());
                dispatch(fetchStatisticsThunk(12));
              }}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${activeTab === key ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-2">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fadeIn">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-slate-500">person_search</span>
                Giới thiệu
              </h3>
              {form.bio ? (
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{form.bio}</p>
              ) : (
                <div className="text-xs text-slate-450 leading-relaxed py-3 text-center italic">
                  Chưa có giới thiệu. <button onClick={() => setActiveTab('edit')} className="text-primary font-bold hover:underline">Thêm</button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-slate-500">account_balance</span>
                Thông tin chuyển khoản
              </h3>
              {hasBankInfo ? (
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Ngân hàng</p>
                    <p className="mt-1 font-bold text-slate-900">{form.bankName}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Số tài khoản</p>
                    <p className="mt-1 font-mono text-lg font-black text-slate-900">{form.bankAccountNumber}</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Thông tin này sẽ hiển thị cho người muốn ủng hộ bạn bằng chuyển khoản thủ công.</p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 leading-6">
                  Bạn chưa cập nhật tài khoản ngân hàng. Người khác sẽ không thể chuyển khoản thủ công cho bạn.
                  <button type="button" onClick={() => setActiveTab('edit')} className="ml-1 font-bold text-primary hover:underline">Cập nhật ngay</button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-slate-500">query_stats</span>
                Chỉ số nhanh
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-xl font-extrabold text-slate-800">{reputation}</div><div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Uy tín</div></div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-xl font-extrabold text-slate-800">{statsData?.summary?.totalViews?.toLocaleString('vi-VN') || 0}</div><div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Lượt xem</div></div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-xl font-extrabold text-slate-800">{statsData?.summary?.totalPosts || 0}</div><div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Bài viết</div></div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="text-xl font-extrabold text-slate-800">{statsData?.summary?.totalComments || 0}</div><div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Bình luận</div></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fadeIn">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-slate-500">history_edu</span>
                Bài viết gần đây
              </h3>
              {loadingPosts ? (
                <div className="space-y-3 py-6"><div className="h-4 w-1/3 bg-slate-100 animate-pulse rounded" /><div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" /></div>
              ) : !userPosts.length ? (
                <div className="text-center py-12 text-slate-400"><span className="material-symbols-outlined text-4xl text-slate-350">edit_note</span><p className="mt-2 text-sm">Chưa có bài viết nào được đăng tải.</p></div>
              ) : (
                <div className="space-y-3.5">
                  {userPosts.map((post) => (
                    <div key={post._id} className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined text-[16px] text-slate-450 mt-0.5 shrink-0">{post.postType === 'question' ? 'help' : 'rate_review'}</span>
                      <div className="flex-1 leading-snug">
                        <span className="text-slate-400 text-xs mr-2 font-mono">[{new Date(post.createdAt).toLocaleDateString('vi-VN')}]</span>
                        <Link to={`/posts/${post._id}`} className="font-bold text-blue-600 hover:text-blue-800 hover:underline break-words">{post.title}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && <UserActivity />}
      {activeTab === 'statistics' && <UserStatistics />}

      {activeTab === 'edit' && (
        <div className="mt-4">
          <AppCard title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin để cộng đồng dễ kết nối và chuyển khoản ủng hộ">
            <form
              className="mt-4 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                dispatch(updateProfileThunk());
              }}
            >
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-100 dark:border-outline-variant">
                <div className="relative group cursor-pointer w-24 h-24">
                  <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={saving} />
                  </label>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-800 dark:text-inverse-on-surface">Ảnh đại diện</div>
                  <div className="text-xs text-slate-400 mt-0.5">Nhấp vào ảnh để thay đổi</div>
                  {form.avatar && form.avatar !== 'default-avatar.png' && (
                    <button type="button" onClick={handleDeleteAvatar} className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors block mx-auto animate-fadeIn">Xóa ảnh đại diện</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField label="Họ và tên" name="fullName" value={form.fullName} onChange={(event) => dispatch(setProfileField({ field: 'fullName', value: event.target.value }))} required disabled={saving} />
                <InputField label="Email" name="email" value={form.email} onChange={() => {}} disabled />
                <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={(event) => dispatch(setProfileField({ field: 'phone', value: event.target.value }))} placeholder="VD: 09xxxxxxxx" disabled={saving} />
                <InputField label="Chuyên ngành / Công việc" name="major" value={form.major} onChange={(event) => dispatch(setProfileField({ field: 'major', value: event.target.value }))} placeholder="Kỹ thuật phần mềm" disabled={saving} />
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                <h3 className="mb-1 text-sm font-black text-slate-900">Thông tin nhận chuyển khoản</h3>
                <p className="mb-4 text-xs leading-5 text-slate-500">Thông tin này sẽ hiển thị ở hồ sơ công khai và màn hình donate để người khác chuyển khoản thủ công cho bạn.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField label="Tên ngân hàng" name="bankName" value={form.bankName} onChange={(event) => dispatch(setProfileField({ field: 'bankName', value: event.target.value }))} placeholder="VD: Vietcombank, MB Bank..." disabled={saving} />
                  <InputField label="Số tài khoản" name="bankAccountNumber" value={form.bankAccountNumber} onChange={(event) => dispatch(setProfileField({ field: 'bankAccountNumber', value: event.target.value }))} placeholder="VD: 0123456789" disabled={saving} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Chủ tài khoản sẽ mặc định hiển thị theo họ tên hồ sơ của bạn.</p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Bio</span>
                <textarea name="bio" value={form.bio} onChange={(event) => dispatch(setProfileField({ field: 'bio', value: event.target.value }))} maxLength={500} rows={4} disabled={saving} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="Giới thiệu ngắn về bạn, kỹ năng, mảng quan tâm..." />
                <p className="mt-1 text-right text-xs text-slate-500">{bioCount}</p>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <AppButton type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</AppButton>
                <button type="button" onClick={() => setActiveTab('profile')} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800">Hủy bỏ</button>
              </div>
            </form>
          </AppCard>
        </div>
      )}
    </div>
  );
}
