import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTagsThunk } from '../../store/slices/tagSlice';
import { buildSearchParams } from '../../util/filterUtils';

const TAG_DESCRIPTIONS = {
  javascript: 'Các câu hỏi về JavaScript và hệ sinh thái liên quan.',
  react: 'Thư viện UI phía client cho web apps.',
  nodejs: 'Runtime JavaScript phía server.',
  python: 'Ngôn ngữ lập trình đa mục đích, dễ đọc và dễ mở rộng.',
  java: 'Ngôn ngữ lập trình hướng đối tượng phía server.',
  csharp: 'Ngôn ngữ lập trình của Microsoft cho .NET.',
  html: 'Ngôn ngữ đánh dấu cho nội dung web.',
  css: 'Định dạng giao diện và bố cục web.',
  sql: 'Ngôn ngữ truy vấn cơ sở dữ liệu quan hệ.',
  git: 'Hệ thống quản lý phiên bản phân tán.',
  mongodb: 'Cơ sở dữ liệu NoSQL hướng tài liệu.',
  docker: 'Công cụ đóng gói và chạy ứng dụng bằng container.',
};

const PER_PAGE_OPTIONS = [15, 30, 50];

const buildPaginationItems = (current, total) => {
  if (total <= 1) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);

  return items;
};

const TagsPage = () => {
  const dispatch = useDispatch();
  const tagCollection = useSelector((state) =>
    state.tags?.collections?.tagsPage || {
      items: [],
      loading: false,
      error: null,
      pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
    }
  );
  const tags = tagCollection.items || [];
  const loading = tagCollection.loading;
  const error = tagCollection.error;
  const pagination = tagCollection.pagination || { total: 0, totalPages: 0 };
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    let mounted = true;
    const handle = setTimeout(async () => {
      if (!mounted) return;
      dispatch(fetchTagsThunk({
        key: 'tagsPage',
        params: { search, page, limit },
        append: false,
      }));
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(handle);
    };
  }, [search, page, limit]);

  const paginationItems = useMemo(
    () => buildPaginationItems(page, pagination.totalPages || 1),
    [page, pagination.totalPages]
  );

  return (
    <main className="flex-1 flex flex-col min-w-0 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4 mb-6">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Tags</h1>
          <p className="font-body-md text-body-md text-secondary">
            Tag là nhãn giúp phân loại câu hỏi và tìm kiếm nhanh hơn.
          </p>
        </div>
        <div className="w-full md:w-72">
          <div className="relative">
            <span className="material-symbols-outlined text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lọc theo tên tag"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT pl-10 pr-3 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-secondary font-body-sm text-body-sm">Đang tải tags...</div>
      )}

      {!loading && error && (
        <div className="text-error font-body-sm text-body-sm">{error}</div>
      )}

      {!loading && !error && tags.length === 0 && (
        <div className="text-secondary font-body-sm text-body-sm">Không có tag nào phù hợp.</div>
      )}

      {!loading && !error && tags.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((item) => {
            const tagLabel = item.name || item.slug;
            const description = item.description || TAG_DESCRIPTIONS[item.slug] || `Các câu hỏi liên quan đến ${tagLabel}.`;
            const params = new URLSearchParams(buildSearchParams({ tags: item.slug, page: 1, limit: 15 }));

            return (
              <div key={item.slug} className="border border-outline-variant rounded-DEFAULT bg-surface-container-lowest p-4 shadow-sm">
                <Link
                  to={`/home?${params.toString()}`}
                  className="inline-flex items-center bg-secondary-fixed text-[#39739d] font-label-mono text-label-mono px-2.5 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80"
                  title={`Lọc bài viết theo tag: ${tagLabel}`}
                >
                  {tagLabel}
                </Link>
                <p className="mt-3 text-secondary font-body-sm text-body-sm leading-5">{description}</p>
                <div className="mt-4 flex items-center justify-between text-secondary font-body-sm text-body-sm">
                  <span>{item.totalCount.toLocaleString('vi-VN')} câu hỏi</span>
                  <span>{item.todayCount.toLocaleString('vi-VN')} hỏi hôm nay</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-outline-variant pt-4 mt-6">
          <div className="flex items-center gap-1 flex-wrap">
            {paginationItems.map((item) => {
              if (typeof item !== 'number') {
                return (
                  <span key={item} className="px-2 text-secondary">...</span>
                );
              }

              const isActive = item === page;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary border-primary-container'
                      : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
              className="px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border border-outline-variant text-secondary hover:bg-surface-container-low"
              disabled={page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
            <span>mỗi trang</span>
            <div className="flex items-center gap-1">
              {PER_PAGE_OPTIONS.map((size) => {
                const isActive = size === limit;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setLimit(size);
                      setPage(1);
                    }}
                    className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT border transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary border-primary-container'
                        : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TagsPage;
