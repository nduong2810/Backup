import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    setAuthField,
    resetAuthState,
    registerThunk,
    verifyRegisterOtpThunk
} from '../../store/slices/authSlice';

import RegisterFormUI from '../../components/auth/RegisterFormUI';
import SharedVerifyOTP from '../../components/auth/SharedVerifyOTP';

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { step, form, registeredEmail, loading, errorMessage, successMessage } = useSelector((state) => state.auth);

    // Xóa sạch dữ liệu cũ nếu người dùng thoát trang và vào lại
    useEffect(() => {
        dispatch(resetAuthState());
    }, [dispatch]);

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

    return (
        <div className="mx-auto w-full max-w-md mt-8">

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
                />
            )}

        </div>
    );
}