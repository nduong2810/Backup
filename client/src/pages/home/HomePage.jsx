import { useSelector } from 'react-redux';
import SearchBar from '../../components/common/SearchBar';
import FilterSidebar from '../../components/common/FilterSidebar';
import { usePostFilters } from '../../hook/usePostFilters';

function TagBadge({ tag }) {
  return (
    <span className="inline-block bg-sky-50 text-sky-700 text-xs font-medium px-2 py-0.5 rounded-md border border-sky-200">
      {tag}
    </span>
  );
}

function StatusBadge({ hasBestAnswer, answerCount }) {
  if (hasBestAnswer) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 border border-green-400 bg-green-50 px-2 py-0.5 rounded-md">
        <span>✓</span>
        {answerCount ?? 0} câu trả lời
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-slate-400 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-md">
      {answerCount ?? 0} câu trả lời
    </span>
  );
}

function PostCard({ post }) {
  return (
    <article className="flex flex-col sm:flex-row gap-4 py-4 px-3 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
      {/* Thống kê (votes / answers / views) */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:w-20 flex-shrink-0 text-right">
        <div className="text-xs text-slate-600">
          <span className="font-bold text-sm">{post.upvotes ?? 0}</span> votes
        </div>
        <StatusBadge hasBestAnswer={!!post.bestAnswer} answerCount={post.answerCount} />
        <div className="text-xs text-slate-400">
          <span className="font-semibold">{post.views ?? 0}</span> views
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-sky-700 hover:text-sky-900 cursor-pointer mb-1 leading-snug break-words">
          {post.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-2 break-words">
          {post.content}
        </p>

        {/* Tags + Author */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(post.tags ?? []).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
            <div className="w-5 h-5 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs">
              {post.author?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sky-600 font-medium">{post.author?.fullName ?? 'Ẩn danh'}</span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostListSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="py-4 px-3 border-b border-slate-100 animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 flex flex-col items-end gap-2">
              <div className="h-4 w-12 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-10 bg-slate-200 rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
              <div className="flex gap-1 mt-1">
                <div className="h-5 w-14 bg-slate-200 rounded" />
                <div className="h-5 w-14 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomePage() {
  const { list: posts, loading, error, pagination, activeFilters } = useSelector(
    (state) => state.posts
  );
  const {
    filters,
    handleFilterChange,
    handleSearch,
    handleApplyFilters,
    handleClearFilters,
    refetch,
  } = usePostFilters();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header  */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <h1 className="text-xl font-bold text-sky-700 shrink-0">IT Forum</h1>
          {/* Search Bar ở Header */}
          <div className="flex-1 max-w-2xl">
            <SearchBar
              value={filters.keyword}
              onChange={(value) => handleFilterChange('keyword', value)}
              onSearch={handleSearch}
            />
          </div>
          <button
            id="ask-question-btn"
            className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Đặt câu hỏi
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* Cột Trái: Danh sách bài đăng */}
        <main className="flex-1 min-w-0">
          {/* Tiêu đề + bộ đếm */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Bài viết mới nhất</h2>
              <p className="text-sm text-slate-500">{pagination.total.toLocaleString('vi-VN')} bài viết</p>
            </div>
            {/* Hiển thị active filters nếu có */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1">
                <span>Đang lọc</span>
              </div>
            )}
          </div>

          {/* Nội dung chính */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Loading Skeleton */}
            {loading && <PostListSkeleton />}

            {/* Lỗi */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <span className="text-4xl mb-3">⚠️</span>
                <p className="text-slate-600 font-medium">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-4 text-sky-600 hover:text-sky-800 text-sm underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Không có kết quả */}
            {!loading && !error && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <p className="text-slate-600 font-medium">Không tìm thấy bài đăng nào</p>
                <p className="text-slate-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              </div>
            )}

            {/* Danh sách bài đăng */}
            {!loading && !error && posts.length > 0 && (
              <div>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}

                {/* Phân trang đơn giản */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Cột Phải: Filter Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </aside>
      </div>
    </div>
  );
}

export default HomePage;
