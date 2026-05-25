import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchSavedIds,
  fetchSavedCollections,
  createSavedCollection,
  renameSavedCollection,
  deleteSavedCollection,
  fetchSavedPosts,
  savePost,
  removeSavedPost,
  removeSavedPosts,
  moveSavedPosts,
} from '../../services/savedService';

const initialState = {
  ids: [],
  collections: [],
  savedPosts: [],
  loadingIds: false,
  loadingCollections: false,
  loadingPosts: false,
  actionLoading: false,
  error: null,
};

const extractError = (error) =>
  error?.response?.data?.message || 'Co loi xay ra, vui long thu lai.';

export const fetchSavedIdsThunk = createAsyncThunk(
  'saved/fetchIds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchSavedIds();
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const fetchCollectionsThunk = createAsyncThunk(
  'saved/fetchCollections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchSavedCollections();
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const createCollectionThunk = createAsyncThunk(
  'saved/createCollection',
  async (name, { rejectWithValue }) => {
    try {
      const response = await createSavedCollection(name.trim());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const renameCollectionThunk = createAsyncThunk(
  'saved/renameCollection',
  async ({ collectionId, name }, { rejectWithValue }) => {
    try {
      const response = await renameSavedCollection(collectionId, name.trim());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const deleteCollectionThunk = createAsyncThunk(
  'saved/deleteCollection',
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await deleteSavedCollection(collectionId);
      return { collectionId, defaultCollection: response.data.data };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const fetchSavedPostsThunk = createAsyncThunk(
  'saved/fetchPosts',
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await fetchSavedPosts(collectionId);
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const toggleSaveThunk = createAsyncThunk(
  'saved/toggleSave',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { ids } = getState().saved;
      if (ids.includes(postId)) {
        await removeSavedPost(postId);
        return { postId, saved: false };
      }
      await savePost(postId);
      return { postId, saved: true };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const savePostToCollectionThunk = createAsyncThunk(
  'saved/saveToCollection',
  async ({ postId, collectionId }, { rejectWithValue }) => {
    try {
      await savePost(postId, collectionId || undefined);
      return { postId };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const removeSavedPostsThunk = createAsyncThunk(
  'saved/removePosts',
  async (postIds, { rejectWithValue }) => {
    try {
      await removeSavedPosts(postIds);
      return postIds;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const moveSavedPostsThunk = createAsyncThunk(
  'saved/movePosts',
  async ({ postIds, toCollectionId }, { rejectWithValue }) => {
    try {
      await moveSavedPosts(postIds, toCollectionId);
      return { postIds, toCollectionId };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    resetSavedState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedIdsThunk.pending, (state) => {
        state.loadingIds = true;
        state.error = null;
      })
      .addCase(fetchSavedIdsThunk.fulfilled, (state, action) => {
        state.loadingIds = false;
        state.ids = action.payload;
      })
      .addCase(fetchSavedIdsThunk.rejected, (state, action) => {
        state.loadingIds = false;
        state.error = action.payload;
      })
      .addCase(fetchCollectionsThunk.pending, (state) => {
        state.loadingCollections = true;
        state.error = null;
      })
      .addCase(fetchCollectionsThunk.fulfilled, (state, action) => {
        state.loadingCollections = false;
        state.collections = action.payload;
      })
      .addCase(fetchCollectionsThunk.rejected, (state, action) => {
        state.loadingCollections = false;
        state.error = action.payload;
      })
      .addCase(createCollectionThunk.fulfilled, (state, action) => {
        state.collections = [...state.collections, action.payload];
      })
      .addCase(renameCollectionThunk.fulfilled, (state, action) => {
        state.collections = state.collections.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(deleteCollectionThunk.fulfilled, (state, action) => {
        state.collections = state.collections.filter(
          (item) => item._id !== action.payload.collectionId
        );
      })
      .addCase(fetchSavedPostsThunk.pending, (state) => {
        state.loadingPosts = true;
        state.error = null;
      })
      .addCase(fetchSavedPostsThunk.fulfilled, (state, action) => {
        state.loadingPosts = false;
        state.savedPosts = action.payload;
      })
      .addCase(fetchSavedPostsThunk.rejected, (state, action) => {
        state.loadingPosts = false;
        state.error = action.payload;
      })
      .addCase(toggleSaveThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(toggleSaveThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { postId, saved } = action.payload;
        if (saved) {
          if (!state.ids.includes(postId)) {
            state.ids = [...state.ids, postId];
          }
        } else {
          state.ids = state.ids.filter((id) => id !== postId);
        }
      })
      .addCase(toggleSaveThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(savePostToCollectionThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(savePostToCollectionThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { postId } = action.payload;
        if (!state.ids.includes(postId)) {
          state.ids = [...state.ids, postId];
        }
      })
      .addCase(savePostToCollectionThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(removeSavedPostsThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeSavedPostsThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const removedIds = new Set(action.payload);
        state.ids = state.ids.filter((id) => !removedIds.has(id));
        state.savedPosts = state.savedPosts.filter((item) => !removedIds.has(item.post?._id));
      })
      .addCase(removeSavedPostsThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(moveSavedPostsThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(moveSavedPostsThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(moveSavedPostsThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSavedState } = savedSlice.actions;
export default savedSlice.reducer;
