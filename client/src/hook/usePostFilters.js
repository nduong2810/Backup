import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { fetchPostsThunk } from '../store/slices/postSlice';
import {
  DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  parseSearchQuery,
  buildSearchParams,
  getSearchStringFromFilters,
} from '../util/filterUtils';

export const usePostFilters = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const appliedFilters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    // Only fetch posts if we are on the main posts page (/ or /home)
    const isPostListPage = location.pathname === '/' || location.pathname === '/home';
    if (!isPostListPage) return;

    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, ...appliedFilters }));
      setSearchInput(getSearchStringFromFilters(appliedFilters));
    }, 0);
    dispatch(fetchPostsThunk(appliedFilters));
    return () => clearTimeout(timer);
  }, [dispatch, searchParams, appliedFilters, location.pathname]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setFilters(DEFAULT_FILTERS);
      setSearchInput('');
      setSearchParams({});
      return;
    }

    const parsed = parseSearchQuery(searchInput);
    const next = {
      ...appliedFilters,
      keyword: parsed.keyword,
      tags: parsed.tags,
      author: parsed.author,
      page: 1,
    };
    const nextParams = buildSearchParams(next);
    setSearchParams(nextParams);
  };

  const handleApplyFilters = (overrides = {}) => {
    const next = { ...filters, ...overrides, keyword: appliedFilters.keyword };
    if (!Object.prototype.hasOwnProperty.call(overrides, 'page')) {
      next.page = 1;
    }
    setSearchParams(buildSearchParams(next));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setSearchParams({});
  };

  const refetch = () => {
    dispatch(fetchPostsThunk(appliedFilters));
  };

  return {
    filters,
    searchInput,
    handleSearchChange,
    handleFilterChange,
    handleSearch,
    handleApplyFilters,
    handleClearFilters,
    refetch,
  };
};
