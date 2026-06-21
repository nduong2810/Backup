import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecentPostsApi } from '../../../services/statisticsService';

const TYPE_BADGES = {
  question: { text: 'Hỏi đáp', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  advice: { text: 'Chia sẻ', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StatsPosts({ timeRange = 'all' }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'score' | 'newest' | 'views'
  const [totalCount, setTotalCount] = useState(0);

  const observer = useRef();
  const containerRef = useRef();

  const fetchPosts = useCallback(async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response = await getMyRecentPostsApi({ page: pageNum, limit: 10, sortBy, timeRange });
      const newPosts = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
      setTotalCount(pagination.total || 0);
      setHasMore(pageNum < (pagination.totalPages || 1));
    } catch (err) {
      console.error('[StatsPosts] Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, timeRange]);

  // Reset and fetch initial page when sortBy or timeRange changes
  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [sortBy, timeRange, fetchPosts]);


  // Fetch next page when page increments
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, false);
    }
  }, [page, fetchPosts]);

  // IntersectionObserver Ref Callback to trigger next page loading
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      }, {
        root: containerRef.current,
        rootMargin: '100px',
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const tabs = [
    { key: 'newest', label: 'Mới nhất' },
    { key: 'score', label: 'Điểm số' },
    { key: 'views', label: 'Lượt xem' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[480px]">
      {/* Header section with sort tabs */}
      <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-slate-500">article</span>
            Bài viết ({totalCount})
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50/50 p-0.5 self-start">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                sortBy === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* List section */}
      <div className="flex-1 min-h-0 relative">
        {loading && page === 1 ? (
          // Skeleton Loader
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-b-0 animate-pulse">
                <div className="h-7 w-11 rounded bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/4 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-16 bg-slate-100 rounded shrink-0" />
              </div>
            ))}
          </div>
        ) : !posts.length ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 py-10">
            <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">drafts</span>
            Chưa có bài viết nào
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 overflow-y-auto pr-1 scrollbar-thin">
            <div className="divide-y divide-slate-100">
              {posts.map((post, index) => {
                const score = post.upvoteCount || 0;
                const badge = TYPE_BADGES[post.postType] || TYPE_BADGES.question;
                const isLast = index === posts.length - 1;

                return (
                  <div
                    key={post._id}
                    ref={isLast ? lastElementRef : null}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/30 first:pt-0 last:pb-0"
                  >
                    {/* Score badge (StackOverflow-style) */}
                    <div
                      className={`flex h-7 w-11 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                        score > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : score < 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                      title={`${score} upvote`}
                    >
                      {score > 0 ? `+${score}` : score}
                    </div>

                    {/* Main post details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className={`inline-flex rounded-full border px-2 py-0.2 text-[9px] font-semibold ${badge.cls}`}>
                          {badge.text}
                        </span>
                        <Link
                          to={`/posts/${post._id}`}
                          className="block truncate text-sm font-semibold text-slate-800 transition-colors hover:text-blue-600"
                        >
                          {post.title}
                        </Link>
                      </div>

                      {/* Secondary info (views and comments) */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">visibility</span>
                          {(post.viewCount || 0).toLocaleString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">chat_bubble</span>
                          {post.commentCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right text-[11px] text-slate-400">
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                );
              })}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
