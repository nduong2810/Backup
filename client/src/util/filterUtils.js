export const DEFAULT_FILTERS = {
  keyword: '',
  status: 'All',
  tags: '',
  sortBy: 'Newest',
  minViews: '',
  minUpvotes: '',
  author: '',
  authorId: '',
  postType: 'All',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 15,
};

export const parseFiltersFromSearchParams = (searchParams) => ({
  keyword: searchParams.get('keyword') ?? '',
  status: searchParams.get('status') ?? 'All',
  tags: searchParams.get('tags') ?? '',
  sortBy: searchParams.get('sortBy') ?? 'Newest',
  minViews: searchParams.get('minViews') ?? '',
  minUpvotes: searchParams.get('minUpvotes') ?? '',
  author: searchParams.get('author') ?? '',
  authorId: searchParams.get('authorId') ?? '',
  postType: searchParams.get('postType') ?? 'All',
  startDate: searchParams.get('startDate') ?? '',
  endDate: searchParams.get('endDate') ?? '',
  page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
  limit: Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '15', 10) || 15)),
});

export const parseSearchQuery = (query) => {
  const value = query || '';
  const tags = [];

  let remaining = value;

  const tagRegex = /\[([^\]]+)\]/g;
  remaining = remaining.replace(tagRegex, (_, tagName) => {
    if (tagName?.trim()) tags.push(tagName.trim());
    return ' ';
  });

  return {
    keyword: remaining.replace(/\s+/g, ' ').trim(),
    tags: tags.join(', '),
  };
};

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
  if (filters.author?.trim()) params.author = filters.author.trim();
  if (filters.authorId?.trim()) params.authorId = filters.authorId.trim();
  if (filters.postType && filters.postType !== 'All') params.postType = filters.postType;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  
  if (filters.page && Number(filters.page) > 1) params.page = String(filters.page);
  if (filters.limit && Number(filters.limit) !== 15) params.limit = String(filters.limit);

  return params;
};
