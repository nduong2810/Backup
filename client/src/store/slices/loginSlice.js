import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginUser } from '../../services/authService';

const initialState = {
  form: {
    email: '',
    password: '',
  },
  loading: false,
  successMessage: '',
  errorMessage: '',
  user: null,
  redirectUrl: '',
  isAuthenticated: false,
};

const extractError = (error) => {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length) return errors[0].msg;
  return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

export const loginThunk = createAsyncThunk(
  'login/submit',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { email, password } = getState().login.form;
      const response = await loginUser(email.trim(), password);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    setLoginField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    clearLoginMessages: (state) => {
      state.errorMessage = '';
      state.successMessage = '';
    },
    resetLoginState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
        state.successMessage = '';
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Đăng nhập thành công.';
        state.user = action.payload.user || null;
        state.redirectUrl = action.payload.redirectUrl || '/user/profile';
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload || 'Đăng nhập thất bại.';
        state.isAuthenticated = false;
      });
  },
});

export const { setLoginField, clearLoginMessages, resetLoginState } = loginSlice.actions;
export default loginSlice.reducer;
