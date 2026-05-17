import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchPostsThunk } from '../store/slices/postSlice';
import {
  DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  buildSearchParams,
} from '../util/filterUtils';

export const usePostFilters = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const appliedFilters = parseFiltersFromSearchParams(searchParams);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...appliedFilters }));
    dispatch(fetchPostsThunk(appliedFilters));
  }, [dispatch, searchParams]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const next = { ...appliedFilters, keyword: filters.keyword.trim() };
    setSearchParams(buildSearchParams(next));
  };

  const handleApplyFilters = () => {
    const next = { ...filters, keyword: appliedFilters.keyword };
    setSearchParams(buildSearchParams(next));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  const refetch = () => {
    dispatch(fetchPostsThunk(appliedFilters));
  };

  return {
    filters,
    handleFilterChange,
    handleSearch,
    handleApplyFilters,
    handleClearFilters,
    refetch,
  };
};
