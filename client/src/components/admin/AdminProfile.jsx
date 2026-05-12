import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import { getAdminProfile } from '../../services/userService';
import {
  fetchProfileThunk,
  setProfileField,
  updateProfileThunk,
} from '../../store/slices/profileSlice';

export default function AdminProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, loading, saving, successMessage, errorMessage } = useSelector((state) => state.profile);
  const [checkingAccess, setCheckingAccess] = useState(true);

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

    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate]);

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || 'Bạn đang ở chế độ quản trị viên.';

  if (checkingAccess || loading) {
    return (
      <AppCard title="Chỉnh sửa hồ sơ quản trị" subtitle="Đang tải dữ liệu...">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </AppCard>
    );
  }

  return (
    <div className="space-y-4">
      <AppCard
        title="Chỉnh sửa hồ sơ quản trị"
        subtitle="Cập nhật thông tin tài khoản quản trị viên"
        rightSlot={(
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ADMIN
          </span>
        )}
      >
        <FormAlert type={alertType} message={alertMessage} />

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch(updateProfileThunk());
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Họ và tên"
              name="fullName"
              value={form.fullName}
              onChange={(event) => dispatch(setProfileField({ field: 'fullName', value: event.target.value }))}
              required
              disabled={saving}
            />
            <InputField label="Email" name="email" value={form.email} onChange={() => {}} disabled />
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
              placeholder="Quản trị hệ thống"
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
              placeholder="Giới thiệu ngắn về vai trò quản trị, mảng phụ trách..."
            />
            <p className="mt-1 text-right text-xs text-slate-500">{bioCount}</p>
          </label>

          <AppButton type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </AppButton>
        </form>
      </AppCard>

      <AppCard title="Tính năng quản trị" subtitle="Các quyền và công cụ dành riêng cho admin">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-800">Truy cập Admin API</p>
            <p className="mt-1 text-xs text-sky-700">Sử dụng được các endpoint yêu cầu quyền quản trị.</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Giám sát người dùng</p>
            <p className="mt-1 text-xs text-emerald-700">Theo dõi hoạt động và xử lý báo cáo từ cộng đồng.</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Thao tác nâng cao</p>
            <p className="mt-1 text-xs text-amber-700">Được cấp quyền thao tác cao hơn tài khoản thông thường.</p>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
