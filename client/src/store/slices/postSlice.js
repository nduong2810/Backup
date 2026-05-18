import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchPostsApi } from '../../services/postService';


export const fetchPostsThunk = createAsyncThunk(
  'posts/fetchPosts',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await fetchPostsApi(filters);
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Không thể tải danh sách bài đăng.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  list: [],    
  loading: false,    
  error: null,        
  pagination: {       
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
  },
  activeFilters: {},
};


const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    resetPostState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostsThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeFilters = action.meta.arg || {};
      })
      .addCase(fetchPostsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data ?? [];
        state.pagination = action.payload.pagination ?? initialState.pagination;
      })
      .addCase(fetchPostsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      });
  },
});

export const { resetPostState } = postSlice.actions;
export default postSlice.reducer;
