import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTagsThunk } from '../../store/slices/tagSlice';

const DEFAULT_TAG_COLLECTION = {
  items: [],
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
};

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const normalizeTag = (tag) => tag.trim().toLowerCase();

function FilterSidebar({ filters, onFilterChange, onApply, onClear, embed = false }) {
  const selectedTags = Array.from(new Set(parseTags(filters.tags).map(normalizeTag)));
  const selectedTagSet = new Set(selectedTags);
  const dispatch = useDispatch();
  const tagCollection = useSelector((state) => state.tags?.collections?.filterTags || DEFAULT_TAG_COLLECTION);
  const tagOptions = tagCollection.items || [];
  const loadingTags = tagCollection.loading;
  const tagPagination = tagCollection.pagination || { page: 1, totalPages: 0 };
  const hasMoreTags = tagPagination.totalPages
    ? tagPagination.page < tagPagination.totalPages
    : false;
  const tagListRef = useRef(null);
  const tagLimit = 12;
  const tagListHeight = embed ? 'h-32' : 'h-40';

  const controlClass = embed
    ? 'w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none'
    : 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all';
  const labelClass = embed
    ? 'font-label-mono text-label-mono font-bold text-on-surface'
    : 'text-xs font-semibold text-slate-600 uppercase tracking-wide';
  const helpTextClass = embed
    ? 'text-xs text-outline'
    : 'text-xs text-slate-400';
  const buttonPrimaryClass = embed
    ? 'flex-1 bg-primary-container hover:bg-primary-container/90 text-on-primary font-body-sm text-body-sm font-semibold py-2 rounded-DEFAULT transition-colors'
    : 'flex-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors duration-150 shadow-sm';
  const buttonSecondaryClass = embed
    ? 'px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-secondary font-body-sm text-body-sm font-semibold rounded-DEFAULT transition-colors'
    : 'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition-colors duration-150';

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange?.(name, value);
  };

  const handleToggleTag = (tag) => {
    const normalized = normalizeTag(tag);
    const next = new Set(selectedTags);
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }
    onFilterChange?.('tags', Array.from(next).join(', '));
  };

  useEffect(() => {
    if (!tagOptions.length && !loadingTags) {
      dispatch(
        fetchTagsThunk({
          key: 'filterTags',
          params: { limit: tagLimit, page: 1 },
          append: false,
        })
      );
    }
  }, [dispatch, loadingTags, tagLimit, tagOptions.length]);

  useEffect(() => {
    if (loadingTags || !hasMoreTags) return;
    const container = tagListRef.current;
    if (!container) return;

    const canScroll = container.scrollHeight > container.clientHeight + 4;
    if (!canScroll) {
      dispatch(
        fetchTagsThunk({
          key: 'filterTags',
          params: { limit: tagLimit, page: tagPagination.page + 1 },
          append: true,
        })
      );
    }
  }, [dispatch, hasMoreTags, loadingTags, tagLimit, tagOptions.length, tagPagination.page]);

  const handleTagScroll = (event) => {
    if (loadingTags || !hasMoreTags) return;

    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

    if (nearBottom) {
      dispatch(
        fetchTagsThunk({
          key: 'filterTags',
          params: { limit: tagLimit, page: tagPagination.page + 1 },
          append: true,
        })
      );
    }
  };

  const visibleTags = useMemo(() => tagOptions, [tagOptions]);

  const body = (
    <div className="p-4 flex flex-col gap-4">

        {/* Status  */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status" className={labelClass}>
            Trạng thái
          </label>
          <select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className={controlClass}
          >
            <option value="All">Tất cả</option>
            <option value="resolved">Đã có câu trả lời</option>
            <option value="unresolved">Chưa có câu trả lời</option>
          </select>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-tags" className={labelClass}>
            Tags
          </label>
          <input
            id="filter-tags"
            type="text"
            name="tags"
            value={filters.tags}
            onChange={handleChange}
            placeholder="react, nodejs, python..."
            aria-label="Nhập tags cách nhau bởi dấu phẩy"
            className={`${controlClass} placeholder:text-outline`}
          />
          <p className={helpTextClass}>Nhiều tag cách nhau bằng dấu phẩy</p>
          <div
            ref={tagListRef}
            className={`flex flex-wrap gap-2 pt-1 overflow-y-auto pr-1 ${tagListHeight}`}
            onScroll={handleTagScroll}
            role="list"
            aria-live="polite"
          >
            {loadingTags && tagOptions.length === 0 && (
              <span className={helpTextClass}>Đang tải tags...</span>
            )}
            {!loadingTags && tagOptions.length === 0 && (
              <span className={helpTextClass}>Chưa có tags.</span>
            )}
            {visibleTags.map((item) => {
              const tagValue = normalizeTag(item.slug || item.name || '');
              const tagLabel = item.name || item.slug || '';
              if (!tagValue) return null;

              const isActive = selectedTagSet.has(tagValue);
              return (
                <button
                  key={tagValue}
                  type="button"
                  onClick={() => handleToggleTag(tagValue)}
                  className={`
                    inline-flex items-center gap-1
                    px-2.5 py-1 rounded-full text-xs font-semibold
                    border transition-colors
                    ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span>{tagLabel}</span>
                  {isActive && <span className="text-xs">×</span>}
                </button>
              );
            })}
            {loadingTags && tagOptions.length > 0 && (
              <span className={helpTextClass}>Đang tải thêm...</span>
            )}
            {!loadingTags && !hasMoreTags && tagOptions.length > 0 && (
              <span className={helpTextClass}>Đã tải hết tags.</span>
            )}
          </div>
        </div>

        {/* Sort By */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-sortby" className={labelClass}>
            Sắp xếp
          </label>
          <select
            id="filter-sortby"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className={controlClass}
          >
            <option value="Newest">Mới nhất</option>
            <option value="MostViewed">Nhiều lượt xem nhất</option>
            <option value="MostUpvoted">Nhiều upvote nhất</option>
          </select>
        </div>

        {/* Min Views & Min Upvotes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-min-views" className={labelClass}>
              Lượt xem tối thiểu
            </label>
            <input
              id="filter-min-views"
              type="number"
              name="minViews"
              value={filters.minViews}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={`${controlClass} placeholder:text-outline`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-min-upvotes" className={labelClass}>
              Upvote tối thiểu
            </label>
            <input
              id="filter-min-upvotes"
              type="number"
              name="minUpvotes"
              value={filters.minUpvotes}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={`${controlClass} placeholder:text-outline`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="filter-apply-btn"
            type="button"
            onClick={onApply}
            className={buttonPrimaryClass}
          >
            Áp dụng
          </button>
          <button
            id="filter-clear-btn"
            type="button"
            onClick={onClear}
            className={buttonSecondaryClass}
          >
            Xoá
          </button>
        </div>
    </div>
  );

  if (embed) {
    return body;
  }

  return (
    <aside
      id="filter-sidebar"
      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        {/* Icon filter */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
        </svg>
        <h2 className="text-sm font-bold text-slate-800">Lọc bài đăng</h2>
      </div>

      {body}
    </aside>
  );
}

export default FilterSidebar;
