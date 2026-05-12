import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { registerUser, verifyRegisterOtp } from '../../services/authService';

const initialState = {
    step: 1, // 1: Đăng ký, 2: Xác thực OTP
    form: {
        fullName: '', email: '', password: '', confirmPassword: '',
    },
    registeredEmail: '', // Lưu email để bước 2 gọi API OTP
    loading: false,
    successMessage: '',
    errorMessage: '',
};

// Hàm bắt lỗi dùng chung
const extractError = (error) => {
    const errors = error?.response?.data?.errors;
    if (Array.isArray(errors) && errors.length) return errors[0].msg;
    return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// Thunk 1: Gọi API Đăng ký
export const registerThunk = createAsyncThunk(
    'auth/register',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { form } = getState().auth;
            const response = await registerUser({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
                confirmPassword: form.confirmPassword,
            });
            return { email: form.email, message: response.data.message };
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// Thunk 2: Gọi API Xác thực OTP
export const verifyRegisterOtpThunk = createAsyncThunk(
    'auth/verifyOtp',
    async (otp, { getState, rejectWithValue }) => {
        try {
            const { registeredEmail } = getState().auth;
            // Gửi email lấy từ state và otp người dùng nhập
            const response = await verifyRegisterOtp(registeredEmail.trim(), otp.trim());
            return response.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthField: (state, action) => {
            const { field, value } = action.payload;
            state.form[field] = value;
        },
        resetAuthState: () => initialState, // Reset mọi thứ về ban đầu
    },
    extraReducers: (builder) => {
        builder
            // Xử lý Đăng ký
            .addCase(registerThunk.pending, (state) => {
                state.loading = true; state.errorMessage = ''; state.successMessage = '';
            })
            .addCase(registerThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.registeredEmail = action.payload.email; // Lưu lại email
                state.successMessage = action.payload.message;
                state.step = 2; // Tự động chuyển sang Form OTP
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.loading = false; state.errorMessage = action.payload;
            })
            // Xử lý OTP
            .addCase(verifyRegisterOtpThunk.pending, (state) => {
                state.loading = true; state.errorMessage = ''; state.successMessage = '';
            })
            .addCase(verifyRegisterOtpThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message || 'Kích hoạt tài khoản thành công.';
            })
            .addCase(verifyRegisterOtpThunk.rejected, (state, action) => {
                state.loading = false; state.errorMessage = action.payload;
            });
    },
});

export const { setAuthField, resetAuthState } = authSlice.actions;
export default authSlice.reducer;