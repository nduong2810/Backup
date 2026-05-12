import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMyProfile, updateMyProfile } from '../../services/userService';

const initialState = {
  form: {
    fullName: '',
    email: '',
    phone: '',
    major: '',
    bio: '',
  },
  loading: false,
  saving: false,
  successMessage: '',
  errorMessage: '',
  errorStatus: null,
};

const extractError = (error) => {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length) {
    return {
      message: errors[0].msg,
      status: error?.response?.status ?? null,
    };
  }
  return {
    message: error?.response?.data?.message || 'Không thể xử lý yêu cầu lúc này.',
    status: error?.response?.status ?? null,
  };
};

export const fetchProfileThunk = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

export const updateProfileThunk = createAsyncThunk(
  'profile/update',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { form } = getState().profile;
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        major: form.major,
        bio: form.bio,
      };
      const response = await updateMyProfile(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    clearProfileMessages: (state) => {
      state.errorMessage = '';
      state.successMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
        state.errorStatus = null;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.form.fullName = action.payload.fullName || '';
        state.form.email = action.payload.email || '';
        state.form.phone = action.payload.phone || '';
        state.form.major = action.payload.major || '';
        state.form.bio = action.payload.bio || '';
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload?.message || action.payload || 'Tải hồ sơ thất bại.';
        state.errorStatus = action.payload?.status ?? null;
      })
      .addCase(updateProfileThunk.pending, (state) => {
        state.saving = true;
        state.errorMessage = '';
        state.successMessage = '';
        state.errorStatus = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = action.payload.message || 'Cập nhật thành công.';

        const user = action.payload.user || {};
        state.form.fullName = user.fullName || state.form.fullName;
        state.form.phone = user.phone || state.form.phone;
        state.form.major = user.major || state.form.major;
        state.form.bio = user.bio || state.form.bio;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.saving = false;
        state.errorMessage = action.payload?.message || action.payload || 'Cập nhật thất bại.';
        state.errorStatus = action.payload?.status ?? null;
      });
  },
});

export const { setProfileField, clearProfileMessages } = profileSlice.actions;
export default profileSlice.reducer;

