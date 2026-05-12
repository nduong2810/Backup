import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { requestResetOtp, resetPassword, verifyResetOtp } from '../../services/authService';

const initialState = {
  step: 1,
  email: '',
  otp: '',
  resetToken: '',
  newPassword: '',
  confirmPassword: '',
  loading: false,
  successMessage: '',
  errorMessage: '',
};

const extractError = (error) => {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length) return errors[0].msg;
  return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

export const requestOtpThunk = createAsyncThunk(
  'forgotPassword/requestOtp',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { email } = getState().forgotPassword;
      const response = await requestResetOtp(email.trim());
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

export const verifyOtpThunk = createAsyncThunk(
  'forgotPassword/verifyOtp',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { email, otp } = getState().forgotPassword;
      const response = await verifyResetOtp(email.trim(), otp.trim());
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

export const resetPasswordThunk = createAsyncThunk(
  'forgotPassword/resetPassword',
  async (_, { getState, rejectWithValue }) => {
    const { email, resetToken, newPassword, confirmPassword } = getState().forgotPassword;

    if (newPassword !== confirmPassword) {
      return rejectWithValue('Mật khẩu xác nhận không khớp.');
    }

    try {
      const response = await resetPassword(
        email.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState,
  reducers: {
    setField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setStep: (state, action) => {
      state.step = action.payload;
      state.errorMessage = '';
      state.successMessage = '';
    },
    clearMessages: (state) => {
      state.errorMessage = '';
      state.successMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtpThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
        state.successMessage = '';
      })
      .addCase(requestOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Gửi OTP thành công.';
        state.step = 2;
      })
      .addCase(requestOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload || 'Gửi OTP thất bại.';
      })
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
        state.successMessage = '';
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Xác thực OTP thành công.';
        state.resetToken = action.payload.resetToken || '';
        state.step = 2;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload || 'Xác thực OTP thất bại.';
      })
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
        state.successMessage = '';
      })
      .addCase(resetPasswordThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Đặt lại mật khẩu thành công.';
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload || 'Đặt lại mật khẩu thất bại.';
      });
  },
});

export const { setField, setStep, clearMessages } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;


