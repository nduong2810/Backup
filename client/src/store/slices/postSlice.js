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
    updatePostVoteInList: (state, action) => {
      const { postId, upvoteCount, downvoteCount, userVote } = action.payload || {};
      if (!postId) return;

      state.list = state.list.map((post) => {
        if (String(post._id) !== String(postId)) return post;

        return {
          ...post,
          upvotes: upvoteCount ?? post.upvotes ?? 0,
          downvotes: downvoteCount ?? post.downvotes ?? 0,
          upvoteCount: upvoteCount ?? post.upvoteCount ?? 0,
          downvoteCount: downvoteCount ?? post.downvoteCount ?? 0,
          userVote: userVote ?? null,
        };
      });
    },
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

export const { resetPostState, updatePostVoteInList } = postSlice.actions;
export default postSlice.reducer;
