import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { fetchPostsThunk } from '../store/slices/postSlice';
import {
  DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  parseSearchQuery,
  buildSearchParams,
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
      setSearchInput(searchParams.get('q') ?? appliedFilters.keyword ?? '');
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
    const mergedTags = Array.from(
      new Set(
        [appliedFilters.tags, parsed.tags]
          .filter(Boolean)
          .join(',')
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
      )
    ).join(', ');

    const next = {
      ...appliedFilters,
      keyword: parsed.keyword,
      tags: mergedTags,
      page: 1,
    };
    const nextParams = buildSearchParams(next);
    if (searchInput.trim()) {
      nextParams.q = searchInput.trim();
    }
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
