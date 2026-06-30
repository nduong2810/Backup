import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMyStatistics } from '../../services/userService';

// ====================================================================
// STATISTICS SLICE - Redux state cho thống kê hoạt động user
// ====================================================================

const initialState = {
  data: null,
  loading: false,
  error: '',
};

export const fetchStatisticsThunk = createAsyncThunk(
  'statistics/fetch',
  async (months = 12, { rejectWithValue }) => {
    try {
      const response = await getMyStatistics(months);
      return response.data.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Không thể tải thống kê';
      return rejectWithValue(message);
    }
  },
);

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    clearStatistics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatisticsThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchStatisticsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStatisticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Tải thống kê thất bại.';
      });
  },
});

export const { clearStatistics } = statisticsSlice.actions;
export default statisticsSlice.reducer;
