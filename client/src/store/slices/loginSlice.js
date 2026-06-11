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

const saveUserToLocalStorage = (user) => {
  if (!user) {
    localStorage.removeItem('user');
    return;
  }
  try {
    const userToStore = { ...user };
    if (userToStore.avatar && userToStore.avatar.startsWith('data:image/')) {
      // Tránh lưu base64 quá lớn gây tràn quota localStorage
      userToStore.avatar = 'default-avatar.png';
    }
    localStorage.setItem('user', JSON.stringify(userToStore));
  } catch (error) {
    console.error('Failed to save user to localStorage:', error);
  }
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
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      saveUserToLocalStorage(state.user);
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
          if (loggedUser) saveUserToLocalStorage(loggedUser);
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
        })
        .addCase('profile/fetch/fulfilled', (state, action) => {
          if (state.user && action.payload) {
            state.user.fullName = action.payload.fullName || state.user.fullName;
            state.user.avatar = action.payload.avatar || state.user.avatar;
            saveUserToLocalStorage(state.user);
          }
        })
        .addCase('profile/update/fulfilled', (state, action) => {
          if (state.user && action.payload) {
            const updatedUser = action.payload.user || {};
            state.user.fullName = updatedUser.fullName || state.user.fullName;
            state.user.avatar = updatedUser.avatar || state.user.avatar;
            saveUserToLocalStorage(state.user);
          }
        });
  },
});

export const { setLoginField, clearLoginMessages, resetLoginState, logout, updateUser } = loginSlice.actions;
export default loginSlice.reducer;
