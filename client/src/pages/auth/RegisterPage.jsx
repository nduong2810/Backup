import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    setAuthField,
    resetAuthState,
    registerThunk,
    resendRegisterOtpThunk,
    verifyRegisterOtpThunk,
    setActivationEmailAndStep
} from '../../store/slices/authSlice';

import RegisterFormUI from '../../components/auth/RegisterFormUI';
import SharedVerifyOTP from '../../components/auth/SharedVerifyOTP';
import AuthLayout from '../../components/auth/AuthLayout';

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { step, form, registeredEmail, loading, errorMessage, successMessage } = useSelector((state) => state.auth);

    // Xóa sạch dữ liệu cũ nếu người dùng thoát trang và vào lại, hoặc chuyển tiếp từ trang đăng nhập
    useEffect(() => {
        if (location.state && location.state.step === 2 && location.state.email) {
            dispatch(setActivationEmailAndStep({
                email: location.state.email,
                step: 2
            }));
            // Xóa state để F5 hoặc đi hướng khác không bị kẹt ở bước 2
            window.history.replaceState({}, document.title);
        } else {
            dispatch(resetAuthState());
        }
    }, [dispatch, location.state]);

    // Handle của Bước 1: Đăng ký
    const handleFieldChange = (field, value) => {
        dispatch(setAuthField({ field, value }));
    };

    const handleRegisterSubmit = () => {
        dispatch(registerThunk());
    };

    // Handle của Bước 2: OTP
    const handleVerifyOtpSubmit = async (otp) => {
        const resultAction = await dispatch(verifyRegisterOtpThunk(otp));
        if (verifyRegisterOtpThunk.fulfilled.match(resultAction)) {
            // Xác thực thành công: Đợi 2s để user đọc chữ "Thành công", rồi đá về Login
            setTimeout(() => {
                dispatch(resetAuthState()); // Dọn dẹp Redux
                navigate('/auth/login'); // Chuyển trang
            }, 2000);
        }
    };

    const handleBackToRegister = () => {
        dispatch(resetAuthState());
    };

    const handleResendOtp = async () => {
        const resultAction = await dispatch(resendRegisterOtpThunk());
        return resendRegisterOtpThunk.fulfilled.match(resultAction);
    };

    return (
        <AuthLayout>

            {step === 1 && (
                <RegisterFormUI
                    form={form}
                    loading={loading}
                    errorMessage={errorMessage}
                    successMessage={successMessage}
                    onFieldChange={handleFieldChange}
                    onSubmit={handleRegisterSubmit}
                />
            )}

            {step === 2 && (
                <SharedVerifyOTP
                    title="Kích hoạt tài khoản"
                    subtitle="Hoàn tất bảo mật để đăng nhập"
                    email={registeredEmail}
                    loading={loading}
                    errorMessage={errorMessage}
                    successMessage={successMessage}
                    onSubmitOTP={handleVerifyOtpSubmit}
                    onBack={handleBackToRegister}
                    onResendOTP={handleResendOtp}
                />
            )}

        </AuthLayout>
    );
}
