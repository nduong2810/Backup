import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginUser, logoutUser } from '../../services/authService';

const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

const initialState = {
  form: {
    email: '',
    password: '',
  },
  loading: false,
  successMessage: '',
  errorMessage: '',
  user: storedUser,
  redirectUrl: '',
  isAuthenticated: !!storedUser,
};

const extractError = (error) => {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length) return errors[0].msg;
  const data = error?.response?.data;
  if (
    data?.code === 'ACCOUNT_NOT_ACTIVATED' ||
    data?.code === 'ACCOUNT_DEACTIVATED' ||
    data?.code === 'ACCOUNT_PENDING_DELETE'
  ) {
    return data;
  }
  return data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
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

export const logoutThunk = createAsyncThunk(
  'login/logout',
  async (_, { dispatch }) => {
    try {
      sessionStorage.setItem('is_logging_out', 'true');
      sessionStorage.removeItem('locked_message');
      await logoutUser();
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất phía server:', error);
    }
    dispatch(logout());
    sessionStorage.setItem('logout_success_message', 'Đăng xuất thành công!');
  }
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
      state.isAuthenticated = false;
      state.redirectUrl = '';
      state.loading = false;
      state.successMessage = '';
      state.errorMessage = '';
      state.form = { email: '', password: '' };
      localStorage.removeItem('user');
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

          state.user = loggedUser;
          state.redirectUrl = action.payload.redirectUrl || '/';
          state.isAuthenticated = !!loggedUser;

          localStorage.removeItem('user');
          if (loggedUser) saveUserToLocalStorage(loggedUser);
        })
        .addCase(loginThunk.rejected, (state, action) => {
          state.loading = false;
          if (typeof action.payload === 'object' && action.payload !== null) {
            if (
              action.payload.code === 'ACCOUNT_NOT_ACTIVATED' ||
              action.payload.code === 'ACCOUNT_DEACTIVATED' ||
              action.payload.code === 'ACCOUNT_PENDING_DELETE'
            ) {
              state.errorMessage = '';
            } else {
              state.errorMessage = action.payload.message || 'Đăng nhập thất bại.';
            }
          } else {
            state.errorMessage = action.payload || 'Đăng nhập thất bại.';
          }
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('user');
        })
        .addCase('profile/fetch/fulfilled', (state, action) => {
          if (state.user && action.payload) {
            state.user.fullName = action.payload.fullName || state.user.fullName;
            state.user.avatar = action.payload.avatar || state.user.avatar;
            state.user.reputation = action.payload.reputation ?? state.user.reputation;
            state.user.reputationInfo = action.payload.reputationInfo || state.user.reputationInfo;
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
