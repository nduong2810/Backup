import apiClient from '../lib/apiClient';

export const fetchSavedIds = () => apiClient.get('/saves/ids');

export const fetchSavedCollections = () => apiClient.get('/saves/collections');

export const createSavedCollection = (name) =>
  apiClient.post('/saves/collections', { name });

export const renameSavedCollection = (collectionId, name) =>
  apiClient.patch(`/saves/collections/${collectionId}`, { name });

export const deleteSavedCollection = (collectionId) =>
  apiClient.delete(`/saves/collections/${collectionId}`);

export const fetchSavedPosts = (collectionId) =>
  apiClient.get('/saves/posts', { params: { collectionId } });

export const savePost = (postId, collectionId) =>
  apiClient.post('/saves/posts', { postId, collectionId });

export const removeSavedPost = (postId) =>
  apiClient.delete(`/saves/posts/${postId}`);

export const removeSavedPosts = (postIds) =>
  apiClient.delete('/saves/posts', { data: { postIds } });

export const moveSavedPosts = (postIds, toCollectionId) =>
  apiClient.patch('/saves/posts/move', { postIds, toCollectionId });
