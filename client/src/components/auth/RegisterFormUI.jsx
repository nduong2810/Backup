import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';

export default function RegisterFormUI({ form, loading, errorMessage, successMessage, onFieldChange, onSubmit }) {
    const alertType = errorMessage ? 'error' : successMessage ? 'success' : '';
    const alertMessage = errorMessage || successMessage || '';

    return (
        <AppCard title="Đăng ký tài khoản" subtitle="Tham gia diễn đàn sinh viên IT">
            <FormAlert type={alertType} message={alertMessage} />
            <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                <InputField label="Họ và tên" name="fullName" value={form.fullName} onChange={(e) => onFieldChange('fullName', e.target.value)} required disabled={loading} />
                <InputField label="Email" name="email" type="email" value={form.email} onChange={(e) => onFieldChange('email', e.target.value)} required disabled={loading} />
                <InputField label="Mật khẩu" name="password" type="password" value={form.password} onChange={(e) => onFieldChange('password', e.target.value)} required disabled={loading} />
                <InputField label="Xác nhận mật khẩu" name="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => onFieldChange('confirmPassword', e.target.value)} required disabled={loading} />
                <AppButton type="submit" fullWidth disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng ký ngay'}</AppButton>
            </form>
        </AppCard>
    );
}