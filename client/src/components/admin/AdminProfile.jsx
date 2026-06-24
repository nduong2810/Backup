import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import { getAdminProfile, changeMyPassword } from '../../services/userService';
import {
  fetchProfileThunk,
  setProfileField,
  updateProfileThunk,
  clearProfileMessages,
} from '../../store/slices/profileSlice';
import { useToast } from '../../context/ToastContext';

export default function AdminProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { form, loading, saving, successMessage, errorMessage } = useSelector((state) => state.profile);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit'

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const hasPasswordInput = Boolean(oldPassword || newPassword || confirmPassword);
    if (hasPasswordInput) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        toast.error('Vui lòng điền đầy đủ cả 3 trường để đổi mật khẩu.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('Mật khẩu mới tối thiểu 6 ký tự.');
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        toast.error('Mật khẩu mới phải chứa ít nhất 1 chữ hoa.');
        return;
      }
      if (!/[a-z]/.test(newPassword)) {
        toast.error('Mật khẩu mới phải chứa ít nhất 1 chữ thường.');
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        toast.error('Mật khẩu mới phải chứa ít nhất 1 số.');
        return;
      }
      if (newPassword === oldPassword) {
        toast.error('Mật khẩu mới không được trùng với mật khẩu cũ.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    try {
      setChangingPassword(true);
      if (hasPasswordInput) {
        await changeMyPassword(oldPassword, newPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      const resultAction = await dispatch(updateProfileThunk());
      if (updateProfileThunk.fulfilled.match(resultAction)) {
        toast.success(hasPasswordInput ? 'Cập nhật và đổi mật khẩu thành công!' : 'Cập nhật thành công!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setChangingPassword(false);
    }
  };

  const bioCount = useMemo(() => `${form.bio.length}/500`, [form.bio]);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      try {
        await getAdminProfile();
        if (!isMounted) return;
        await dispatch(fetchProfileThunk());
      } catch (error) {
        if (!isMounted) return;
        const status = error?.response?.status;
        if (status === 401) {
          navigate('/auth/login', { replace: true });
          return;
        }
        navigate('/user/profile', { replace: true });
      } finally {
        if (isMounted) setCheckingAccess(false);
      }
    };

    verifyAdminAccess();
    return () => { isMounted = false; };
  }, [dispatch, navigate]);

  useEffect(() => {
    if (successMessage) {
      dispatch(clearProfileMessages());
      setActiveTab('overview');
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearProfileMessages());
    }
  }, [errorMessage, toast, dispatch]);

  // Avatar handlers (giống User Profile)
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

  if (checkingAccess || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-2 space-y-8">
        <div className="h-32 animate-pulse rounded-2xl bg-white border border-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  const avatarUrl =
    form.avatar && form.avatar !== 'default-avatar.png'
      ? form.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          form.fullName || 'A'
        )}&background=004e9f&color=fff&size=120`;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-2">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full">
          {/* Avatar — hiển thị tĩnh */}
          <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            <img
              src={avatarUrl}
              alt="Admin Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name & Metadata */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-3xl font-extrabold text-slate-800 truncate">
                {form.fullName || 'Quản trị viên'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                <span className="material-symbols-outlined text-xs">shield</span>
                ADMIN
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1.5 text-sm text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg text-slate-400">mail</span>
                <span>{form.email}</span>
              </div>
              {form.phone && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-slate-400">call</span>
                  <span>{form.phone}</span>
                </div>
              )}
              {form.major && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-slate-400">work</span>
                  <span>{form.major}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Quản trị viên hệ thống ITForum. Giám sát hoạt động, phê duyệt nội dung và hỗ trợ cộng đồng.
            </p>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
          className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold shadow-sm transition-all shrink-0 ${
            activeTab === 'edit'
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {activeTab === 'edit' ? 'close' : 'edit'}
          </span>
          {activeTab === 'edit' ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
        </button>
      </div>

      {/* Tab navigation */}
      {activeTab !== 'edit' && (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tổng quan
          </button>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:items-stretch mt-2">
          {/* Left Column — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Bio section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3.5 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-slate-500">person_search</span>
                Giới thiệu
              </h3>
              {form.bio ? (
                <p className="text-[15px] text-slate-600 whitespace-pre-wrap leading-relaxed text-justify break-words">
                  {form.bio}
                </p>
              ) : (
                <div className="text-[15px] text-slate-400 leading-relaxed py-6 text-center">
                  Mục giới thiệu đang trống.{' '}
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="text-primary font-bold hover:underline"
                  >
                    Cập nhật ngay
                  </button>
                </div>
              )}
            </div>

            {/* Quyền hạn */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-1">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3.5 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-slate-500">verified_user</span>
                Quyền hạn
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Toàn quyền hệ thống', desc: 'Truy cập đầy đủ API nghiệp vụ và quản trị.' },
                  { label: 'Duyệt giao dịch', desc: 'Phê duyệt bill COD và giao dịch quyên góp.' },
                  { label: 'Kiểm duyệt nội dung', desc: 'Xử lý báo cáo vi phạm từ cộng đồng.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 text-base">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <div>
                      <p className="font-bold text-slate-800">{item.label}</p>
                      <p className="text-slate-500 mt-1 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — 3/5 */}
          <div className="lg:col-span-3 lg:flex lg:flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:flex-1 sm:grid-rows-2">
              {[
                {
                  icon: 'bar_chart',
                  title: 'Trang quản trị',
                  desc: 'Theo dõi thống kê hệ thống, biểu đồ tăng trưởng và doanh thu.',
                  link: '/admin/dashboard',
                  color: 'text-primary',
                  bgColor: 'bg-primary/5 border-primary/10',
                  hoverBg: 'group-hover:bg-primary group-hover:text-white',
                },
                {
                  icon: 'flag',
                  title: 'Duyệt cờ báo cáo',
                  desc: 'Giải quyết các phản hồi gắn cờ vi phạm từ thành viên.',
                  link: '/admin/dashboard?tab=flags',
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50 border-orange-100',
                  hoverBg: 'group-hover:bg-orange-500 group-hover:text-white',
                },
                {
                  icon: 'payments',
                  title: 'Duyệt bill ủng hộ COD',
                  desc: 'Xác thực ảnh chuyển khoản thủ công và duyệt lượt ủng hộ.',
                  link: '/admin/dashboard?tab=donations',
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-50 border-emerald-100',
                  hoverBg: 'group-hover:bg-emerald-500 group-hover:text-white',
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.link)}
                  className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between h-full"
                >
                  <div className="flex flex-col flex-1">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${item.bgColor} ${item.color} ${item.hoverBg} transition-colors`}>
                      <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-xl mt-5">{item.title}</h3>
                    <p className="text-[15px] text-slate-500 mt-2 leading-relaxed flex-1">{item.desc}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-base font-bold text-primary">
                    Truy cập
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Tab Content */}
      {activeTab === 'edit' && (
        <div className="mt-4">
          <AppCard title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin tài khoản quản trị viên">
          <form
            className="mt-4 space-y-5"
            onSubmit={handleProfileSubmit}
          >
            {/* Avatar Change Area */}
            <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-100">
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
                    disabled={saving || changingPassword}
                  />
                </label>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-800">
                  Ảnh đại diện
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Nhấp vào ảnh để thay đổi</div>
                {form.avatar && form.avatar !== 'default-avatar.png' && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors block mx-auto"
                    disabled={saving || changingPassword}
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
                disabled={saving || changingPassword}
              />
              <InputField label="Email" name="email" value={form.email} onChange={() => {}} disabled />
              <InputField
                label="Số điện thoại"
                name="phone"
                value={form.phone}
                onChange={(event) => dispatch(setProfileField({ field: 'phone', value: event.target.value }))}
                placeholder="VD: 09xxxxxxxx"
                disabled={saving || changingPassword}
              />
              <InputField
                label="Chuyên ngành / Chức vụ"
                name="major"
                value={form.major}
                onChange={(event) => dispatch(setProfileField({ field: 'major', value: event.target.value }))}
                placeholder="Quản trị hệ thống"
                disabled={saving || changingPassword}
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
                disabled={saving || changingPassword}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Giới thiệu ngắn về vai trò quản trị, mảng phụ trách..."
              />
              <p className="mt-1 text-right text-xs text-slate-500">{bioCount}</p>
            </label>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="mb-1 text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-slate-500">lock</span>
                Thay đổi mật khẩu
              </h3>
              <p className="mb-4 text-xs leading-5 text-slate-500">Để trống nếu không muốn thay đổi mật khẩu của bạn.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  label="Mật khẩu hiện tại"
                  name="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={saving || changingPassword}
                  allowPasswordToggle
                />
                <InputField
                  label="Mật khẩu mới"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự (chữ hoa, thường, số)"
                  disabled={saving || changingPassword}
                  allowPasswordToggle
                />
                <InputField
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={saving || changingPassword}
                  allowPasswordToggle
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <AppButton type="submit" disabled={saving || changingPassword}>
                {(saving || changingPassword) ? 'Đang lưu...' : 'Lưu thay đổi'}
              </AppButton>
              <button
                type="button"
                onClick={() => {
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setActiveTab('overview');
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800"
                disabled={saving || changingPassword}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </AppCard>
        </div>
      )}
    </div>
  );
}
