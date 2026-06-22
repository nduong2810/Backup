import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  adminUpdateFlagStatusApi,
  createReportTicketApi,
  getAdminFlagsApi,
  getMyReportTicketsApi,
  getPostFlagSummaryApi,
  retractReportApi,
} from '../../services/postService';

const initialState = {
  creating: false,
  createSuccessMessage: '',
  createErrorMessage: '',

  tickets: [],
  loadingTickets: false,
  ticketsErrorMessage: '',
  actionLoadingById: {},

  ownerSummary: null,
  loadingOwnerSummary: false,
  ownerSummaryErrorMessage: '',

  adminFlags: [],
  loadingAdminFlags: false,
  adminFlagsErrorMessage: '',
  adminUpdatingById: {},
};

const extractMessage = (error, fallback) => error?.response?.data?.message || fallback;

export const createReportTicketThunk = createAsyncThunk(
  'reports/create',
  async ({ postId, commentId, flagType, details }, { rejectWithValue }) => {
    try {
      const response = await createReportTicketApi({ postId, commentId, flagType, details });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractMessage(error, 'Không thể gửi cờ báo cáo.'));
    }
  },
);

export const fetchMyReportTicketsThunk = createAsyncThunk(
  'reports/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyReportTicketsApi();
      return response.data;
    } catch (error) {
      return rejectWithValue(extractMessage(error, 'Không thể tải lịch sử báo cáo.'));
    }
  },
);

export const retractReportThunk = createAsyncThunk(
  'reports/retract',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await retractReportApi(ticketId);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        ticketId,
        message: extractMessage(error, 'Không thể rút cờ báo cáo.'),
      });
    }
  },
);

export const fetchPostFlagSummaryThunk = createAsyncThunk(
  'reports/fetchPostSummary',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await getPostFlagSummaryApi(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractMessage(error, 'Không thể tải tổng hợp cờ của bài viết.'));
    }
  },
);

export const fetchAdminFlagsThunk = createAsyncThunk(
  'reports/fetchAdminFlags',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminFlagsApi(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractMessage(error, 'Không thể tải danh sách cờ cho admin.'));
    }
  },
);

export const adminUpdateFlagStatusThunk = createAsyncThunk(
  'reports/adminUpdateStatus',
  async ({ ticketId, nextStatus, note }, { rejectWithValue }) => {
    try {
      const response = await adminUpdateFlagStatusApi(ticketId, { nextStatus, note });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        ticketId,
        message: extractMessage(error, 'Không thể cập nhật trạng thái cờ.'),
      });
    }
  },
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportCreateMessages: (state) => {
      state.createSuccessMessage = '';
      state.createErrorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReportTicketThunk.pending, (state) => {
        state.creating = true;
        state.createSuccessMessage = '';
        state.createErrorMessage = '';
      })
      .addCase(createReportTicketThunk.fulfilled, (state, action) => {
        state.creating = false;
        state.createSuccessMessage = action.payload.message || 'Gửi cờ báo cáo thành công.';
      })
      .addCase(createReportTicketThunk.rejected, (state, action) => {
        state.creating = false;
        state.createErrorMessage = action.payload || 'Gửi cờ báo cáo thất bại.';
      })
      .addCase(fetchMyReportTicketsThunk.pending, (state) => {
        state.loadingTickets = true;
        state.ticketsErrorMessage = '';
      })
      .addCase(fetchMyReportTicketsThunk.fulfilled, (state, action) => {
        state.loadingTickets = false;
        state.tickets = action.payload.data || [];
      })
      .addCase(fetchMyReportTicketsThunk.rejected, (state, action) => {
        state.loadingTickets = false;
        state.ticketsErrorMessage = action.payload || 'Không thể tải lịch sử báo cáo.';
      })
      .addCase(retractReportThunk.pending, (state, action) => {
        state.actionLoadingById[action.meta.arg] = true;
      })
      .addCase(retractReportThunk.fulfilled, (state, action) => {
        const ticketId = action.payload?.data?._id;
        if (ticketId) {
          state.actionLoadingById[ticketId] = false;
          state.tickets = state.tickets.map((item) => (item._id === ticketId ? action.payload.data : item));
        }
      })
      .addCase(retractReportThunk.rejected, (state, action) => {
        const ticketId = action.payload?.ticketId || action.meta.arg;
        state.actionLoadingById[ticketId] = false;
        state.ticketsErrorMessage = action.payload?.message || 'Không thể rút cờ báo cáo.';
      })
      .addCase(fetchPostFlagSummaryThunk.pending, (state) => {
        state.loadingOwnerSummary = true;
        state.ownerSummaryErrorMessage = '';
      })
      .addCase(fetchPostFlagSummaryThunk.fulfilled, (state, action) => {
        state.loadingOwnerSummary = false;
        state.ownerSummary = action.payload.data || null;
      })
      .addCase(fetchPostFlagSummaryThunk.rejected, (state, action) => {
        state.loadingOwnerSummary = false;
        state.ownerSummaryErrorMessage = action.payload || 'Không thể tải tổng hợp cờ của bài viết.';
      })
      .addCase(fetchAdminFlagsThunk.pending, (state) => {
        state.loadingAdminFlags = true;
        state.adminFlagsErrorMessage = '';
      })
      .addCase(fetchAdminFlagsThunk.fulfilled, (state, action) => {
        state.loadingAdminFlags = false;
        state.adminFlags = action.payload.data || [];
      })
      .addCase(fetchAdminFlagsThunk.rejected, (state, action) => {
        state.loadingAdminFlags = false;
        state.adminFlagsErrorMessage = action.payload || 'Không thể tải danh sách cờ cho admin.';
      })
      .addCase(adminUpdateFlagStatusThunk.pending, (state, action) => {
        state.adminUpdatingById[action.meta.arg.ticketId] = true;
      })
      .addCase(adminUpdateFlagStatusThunk.fulfilled, (state, action) => {
        const ticketId = action.payload?.data?._id;
        if (ticketId) {
          state.adminUpdatingById[ticketId] = false;
          state.adminFlags = state.adminFlags.map((item) => (item._id === ticketId ? action.payload.data : item));
        }
      })
      .addCase(adminUpdateFlagStatusThunk.rejected, (state, action) => {
        const ticketId = action.payload?.ticketId || action.meta.arg.ticketId;
        state.adminUpdatingById[ticketId] = false;
        state.adminFlagsErrorMessage = action.payload?.message || 'Không thể cập nhật trạng thái cờ.';
      });
  },
});

export const { clearReportCreateMessages } = reportSlice.actions;
export default reportSlice.reducer;
