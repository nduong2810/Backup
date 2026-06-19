import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTagsApi } from '../../services/postService';
import { adminCreateTag, adminUpdateTag, adminDeleteTag } from '../../services/userService';

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

const extractError = (error) => {
  return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
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

export const createTagThunk = createAsyncThunk(
  'tags/createTag',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await adminCreateTag(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const updateTagThunk = createAsyncThunk(
  'tags/updateTag',
  async ({ tagId, payload }, { rejectWithValue }) => {
    try {
      const response = await adminUpdateTag(tagId, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const deleteTagThunk = createAsyncThunk(
  'tags/deleteTag',
  async (tagId, { rejectWithValue }) => {
    try {
      const response = await adminDeleteTag(tagId);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

const tagSlice = createSlice({
  name: 'tags',
  initialState: {
    collections: {},
    saving: false,
    successMsg: '',
    errorMsg: '',
  },
  reducers: {
    resetTagCollection: (state, action) => {
      const key = action.payload;
      if (key) {
        state.collections[key] = { ...DEFAULT_COLLECTION };
      }
    },
    clearTagMessages: (state) => {
      state.successMsg = '';
      state.errorMsg = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tags
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
      })
      // Create Tag
      .addCase(createTagThunk.pending, (state) => {
        state.saving = true;
        state.errorMsg = '';
        state.successMsg = '';
      })
      .addCase(createTagThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.successMsg = action.payload.message || 'Tạo thẻ tag thành công.';
      })
      .addCase(createTagThunk.rejected, (state, action) => {
        state.saving = false;
        state.errorMsg = action.payload || 'Tạo thẻ tag thất bại.';
      })
      // Update Tag
      .addCase(updateTagThunk.pending, (state) => {
        state.saving = true;
        state.errorMsg = '';
        state.successMsg = '';
      })
      .addCase(updateTagThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.successMsg = action.payload.message || 'Cập nhật thẻ tag thành công.';
      })
      .addCase(updateTagThunk.rejected, (state, action) => {
        state.saving = false;
        state.errorMsg = action.payload || 'Cập nhật thẻ tag thất bại.';
      })
      // Delete Tag
      .addCase(deleteTagThunk.pending, (state) => {
        state.saving = true;
        state.errorMsg = '';
        state.successMsg = '';
      })
      .addCase(deleteTagThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.successMsg = action.payload.message || 'Xóa thẻ tag thành công.';
      })
      .addCase(deleteTagThunk.rejected, (state, action) => {
        state.saving = false;
        state.errorMsg = action.payload || 'Xóa thẻ tag thất bại.';
      });
  },
});

export const { resetTagCollection, clearTagMessages } = tagSlice.actions;
export default tagSlice.reducer;
