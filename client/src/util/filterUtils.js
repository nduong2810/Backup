export const DEFAULT_FILTERS = {
  keyword: '',
  status: 'All',
  tags: '',
  sortBy: 'Newest',
  minViews: '',
  minUpvotes: '',
};

export const parseFiltersFromSearchParams = (searchParams) => ({
  keyword: searchParams.get('keyword') ?? '',
  status: searchParams.get('status') ?? 'All',
  tags: searchParams.get('tags') ?? '',
  sortBy: searchParams.get('sortBy') ?? 'Newest',
  minViews: searchParams.get('minViews') ?? '',
  minUpvotes: searchParams.get('minUpvotes') ?? '',
});

export const buildSearchParams = (filters) => {
  const params = {};
  const keyword = filters.keyword?.trim();
  const tags = filters.tags?.trim();

  if (keyword) params.keyword = keyword;
  if (tags) params.tags = tags;
  if (filters.status && filters.status !== 'All') params.status = filters.status;
  if (filters.sortBy && filters.sortBy !== 'Newest') params.sortBy = filters.sortBy;
  if (filters.minViews !== '' && filters.minViews !== null && filters.minViews !== undefined) {
    params.minViews = String(filters.minViews);
  }
  if (filters.minUpvotes !== '' && filters.minUpvotes !== null && filters.minUpvotes !== undefined) {
    params.minUpvotes = String(filters.minUpvotes);
  }

  return params;
};
