import apiClient from '../lib/apiClient';

export const getMyRecentPostsApi = ({ page = 1, limit = 10, sortBy = 'newest', timeRange = 'all' } = {}) =>
  apiClient.get('/user/statistics/posts', {
    params: { page, limit, sortBy, timeRange },
  });

export const getMyRecentCommentsApi = ({ page = 1, limit = 10, sortBy = 'newest', timeRange = 'all' } = {}) =>
  apiClient.get('/user/statistics/comments', {
    params: { page, limit, sortBy, timeRange },
  });

export const getMyRecentVotesApi = ({ page = 1, limit = 10, sortBy = 'newest', timeRange = 'all' } = {}) =>
  apiClient.get('/user/statistics/votes', {
    params: { page, limit, sortBy, timeRange },
  });


export const getMyRecentReputationApi = ({ page = 1, limit = 10 } = {}) =>
  apiClient.get('/user/statistics/reputation', {
    params: { page, limit },
  });

