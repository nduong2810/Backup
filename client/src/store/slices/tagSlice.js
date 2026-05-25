import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTagsApi } from '../../services/postService';

const DEFAULT_COLLECTION = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 0,
    totalPages: 0,
  },
};

const ensureCollection = (state, key) => {
  if (!state.collections[key]) {
    state.collections[key] = { ...DEFAULT_COLLECTION };
  }
  return state.collections[key];
};

export const fetchTagsThunk = createAsyncThunk(
  'tags/fetchTags',
  async ({ key, params, append = false }, { rejectWithValue }) => {
    try {
      const response = await getTagsApi(params);
      return {
        key,
        append,
        data: response?.data?.data ?? [],
        pagination: response?.data?.pagination ?? DEFAULT_COLLECTION.pagination,
      };
    } catch (error) {
      const message = error?.response?.data?.message || 'Không thể tải danh sách tags.';
      return rejectWithValue({ key, message });
    }
  }
);

const tagSlice = createSlice({
  name: 'tags',
  initialState: {
    collections: {},
  },
  reducers: {
    resetTagCollection: (state, action) => {
      const key = action.payload;
      if (key) {
        state.collections[key] = { ...DEFAULT_COLLECTION };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTagsThunk.pending, (state, action) => {
        const { key } = action.meta.arg;
        const collection = ensureCollection(state, key);
        collection.loading = true;
        collection.error = null;
      })
      .addCase(fetchTagsThunk.fulfilled, (state, action) => {
        const { key, append, data, pagination } = action.payload;
        const collection = ensureCollection(state, key);
        collection.loading = false;
        collection.pagination = pagination || DEFAULT_COLLECTION.pagination;

        if (append) {
          const map = new Map(collection.items.map((item) => [item.slug, item]));
          data.forEach((item) => {
            if (item?.slug) map.set(item.slug, item);
          });
          collection.items = Array.from(map.values());
        } else {
          collection.items = Array.isArray(data) ? data : [];
        }
      })
      .addCase(fetchTagsThunk.rejected, (state, action) => {
        const { key, message } = action.payload || {};
        const collection = ensureCollection(state, key || 'default');
        collection.loading = false;
        collection.error = message || 'Không thể tải danh sách tags.';
        if (!collection.items?.length) {
          collection.items = [];
        }
      });
  },
});

export const { resetTagCollection } = tagSlice.actions;
export default tagSlice.reducer;
