import { useEffect, useState } from 'react';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import InputField from '../ui/InputField';
import FormAlert from '../ui/FormAlert';

const OTP_TTL_SECONDS = 5 * 60;

const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function SharedVerifyOTP({ title, subtitle, email, loading, errorMessage, successMessage, onSubmitOTP, onBack, onResendOTP }) {
    const [otp, setOtp] = useState(''); // Lưu cục bộ cho nhẹ máy
    const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);

    const alertType = errorMessage ? 'error' : successMessage ? 'success' : 'info';
    const alertMessage = errorMessage || successMessage || `Mã OTP đã được gửi tới: ${email}. Mã có hiệu lực trong 5 phút.`;

    useEffect(() => {
        setTimeLeft(OTP_TTL_SECONDS);
    }, [email]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft((current) => Math.max(current - 1, 0));
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const handleResend = async () => {
        if (!onResendOTP) return;
        const isSuccessful = await onResendOTP();
        if (isSuccessful) {
            setOtp('');
            setTimeLeft(OTP_TTL_SECONDS);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (timeLeft <= 0) return;
        onSubmitOTP(otp);
    };

    return (
        <AppCard title={title} subtitle={subtitle}>
            <FormAlert type={alertType} message={alertMessage} />
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <InputField
                    label="Mã OTP"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã 6 chữ số"
                    required
                    maxLength={6}

                    disabled={loading}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                        {timeLeft > 0
                            ? `Mã OTP hết hạn sau ${formatTime(timeLeft)}.`
                            : 'Mã OTP đã hết hạn. Vui lòng gửi lại.'}
                    </span>
                    {timeLeft <= 0 && onResendOTP && (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="font-semibold text-sky-700 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                        </button>
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <AppButton variant="secondary" onClick={onBack} disabled={loading} fullWidth>
                            Quay lại
                        </AppButton>
                    </div>
                    <div className="flex-1">
                        <AppButton type="submit" fullWidth disabled={loading || otp.length < 6 || timeLeft <= 0}>
                            {loading ? 'Đang xử lý...' : 'Xác nhận mã'}
                        </AppButton>
                    </div>
                </div>
            </form>
        </AppCard>
    );
}