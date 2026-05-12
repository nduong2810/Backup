import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';
import {
  fetchProfileThunk,
  setProfileField,
  updateProfileThunk,
} from '../../store/slices/profileSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, loading, saving, successMessage, errorMessage, errorStatus } = useSelector((state) => state.profile);

  const bioCount = useMemo(() => `${form.bio.length}/500`, [form.bio]);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (errorStatus === 401) {
      navigate('/auth/login', { replace: true });
    }
  }, [errorStatus, navigate]);

  const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
  const alertMessage = errorMessage || successMessage || '';

  if (loading) {
    return (
      <AppCard title="Hồ sơ cá nhân" subtitle="Đang tải dữ liệu...">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </AppCard>
    );
  }

  return (
    <AppCard title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin để cộng đồng dễ kết nối hơn">
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
  );
}
