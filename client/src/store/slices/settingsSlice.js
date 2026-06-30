import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAdminSystemSettings, updateAdminSystemSetting } from '../../services/userService';

const initialState = {
  settings: [],
  loading: false,
  savingKey: '',
  successMsg: '',
  errorMsg: '',
};

const extractError = (error) => {
  return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

export const fetchSettingsThunk = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAdminSystemSettings();
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Không thể tải danh sách cấu hình hệ thống.');
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const updateSettingThunk = createAsyncThunk(
  'settings/update',
  async ({ key, value }, { rejectWithValue }) => {
    try {
      const response = await updateAdminSystemSetting({ key, value });
      if (response.data && response.data.success) {
        return { key, value };
      }
      return rejectWithValue('Cập nhật thất bại.');
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateLocalInputValue: (state, action) => {
      const { key, value } = action.payload;
      state.settings = state.settings.map(s =>
        s.key === key ? { ...s, value } : s
      );
    },
    clearMessages: (state) => {
      state.successMsg = '';
      state.errorMsg = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettingsThunk.pending, (state) => {
        state.loading = true;
        state.errorMsg = '';
        state.successMsg = '';
      })
      .addCase(fetchSettingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMsg = action.payload || 'Tải cài đặt thất bại.';
      })
      // Update Setting
      .addCase(updateSettingThunk.pending, (state, action) => {
        state.savingKey = action.meta.arg.key;
        state.errorMsg = '';
        state.successMsg = '';
      })
      .addCase(updateSettingThunk.fulfilled, (state, action) => {
        state.savingKey = '';
        const { key, value } = action.payload;
        state.settings = state.settings.map(s =>
          s.key === key ? { ...s, value } : s
        );

        const titleMap = {
          'reputation_daily_cap': 'Hạn mức điểm danh tiếng nhận trong ngày (Daily Cap)',
          'flag_auto_hide_threshold': 'Ngưỡng tự động ẩn bài đăng khi bị báo cáo (Flags)',
          'reputation_upvote_score': 'Điểm cộng uy tín khi bài đăng nhận Upvote',
          'reputation_downvote_score': 'Điểm trừ uy tín khi bài đăng bị Downvote',
        };
        const title = titleMap[key] || key;
        state.successMsg = `Đã cập nhật "${title}" thành công.`;
      })
      .addCase(updateSettingThunk.rejected, (state, action) => {
        state.savingKey = '';
        state.errorMsg = action.payload || 'Không thể lưu cài đặt.';
      });
  },
});

export const { updateLocalInputValue, clearMessages } = settingsSlice.actions;
export default settingsSlice.reducer;
