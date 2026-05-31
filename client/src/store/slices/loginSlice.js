import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginUser } from '../../services/authService';

const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
const storedToken = localStorage.getItem('accessToken');

const initialState = {
  form: {
    email: '',
    password: '',
  },
  loading: false,
  successMessage: '',
  errorMessage: '',
  user: storedUser,
  accessToken: storedToken || null,
  redirectUrl: '',
  isAuthenticated: !!(storedToken || storedUser),
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
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.redirectUrl = '';
      state.loading = false;
      state.successMessage = '';
      state.errorMessage = '';
      state.form = { email: '', password: '' };
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
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

          const loggedUser = action.payload.user || action.payload.data?.user || null;
          const token = action.payload.accessToken || action.payload.token || action.payload.data?.accessToken || action.payload.data?.token || null;

          state.user = loggedUser;
          state.accessToken = token;
          state.redirectUrl = action.payload.redirectUrl || '/';
          state.isAuthenticated = !!(token || loggedUser);

          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          if (loggedUser) localStorage.setItem('user', JSON.stringify(loggedUser));
          if (token) localStorage.setItem('accessToken', token);
        })
        .addCase(loginThunk.rejected, (state, action) => {
          state.loading = false;
          state.errorMessage = action.payload || 'Đăng nhập thất bại.';
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        });
  },
});

export const { setLoginField, clearLoginMessages, resetLoginState, logout } = loginSlice.actions;
export default loginSlice.reducer;
