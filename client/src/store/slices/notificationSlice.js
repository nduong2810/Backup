import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getMyNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../../services/notificationService';

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyNotificationsApi(20);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Không thể tải thông báo.');
    }
  }
);

export const markNotificationReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await markNotificationReadApi(notificationId);
      return { notificationId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Không thể đánh dấu thông báo.');
    }
  }
);

export const markAllNotificationsReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await markAllNotificationsReadApi();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Không thể đánh dấu tất cả thông báo.');
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: '',
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: () => initialState,
    pushRealtimeNotification: (state, action) => {
      const notification = action.payload?.notification;
      if (!notification?._id) return;

      const exists = state.items.some((item) => String(item._id) === String(notification._id));
      if (!exists) {
        state.items.unshift(notification);
        state.items = state.items.slice(0, 20);
      }

      state.unreadCount = action.payload?.unreadCount ?? state.unreadCount + 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Number(action.payload?.unreadCount ?? 0);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.notifications || [];
        state.unreadCount = action.payload?.unreadCount || 0;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể tải thông báo.';
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const notificationId = action.payload?.notificationId;
        state.items = state.items.map((item) => String(item._id) === String(notificationId) ? { ...item, isRead: true } : item);
        state.unreadCount = action.payload?.unreadCount ?? state.unreadCount;
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { resetNotifications, pushRealtimeNotification, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
