import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecentCommentsApi } from '../../../services/statisticsService';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StatsComments({ timeRange = 'all' }) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'score' | 'newest'
  const [totalCount, setTotalCount] = useState(0);

  const observer = useRef();
  const containerRef = useRef();

  const fetchComments = useCallback(async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response = await getMyRecentCommentsApi({ page: pageNum, limit: 10, sortBy, timeRange });
      const newComments = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      setComments((prev) => (isInitial ? newComments : [...prev, ...newComments]));
      setTotalCount(pagination.total || 0);
      setHasMore(pageNum < (pagination.totalPages || 1));
    } catch (err) {
      console.error('[StatsComments] Error fetching comments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, timeRange]);

  // Reset and fetch initial page when sortBy or timeRange changes
  useEffect(() => {
    setPage(1);
    fetchComments(1, true);
  }, [sortBy, timeRange, fetchComments]);


  // Fetch next page when page increments
  useEffect(() => {
    if (page > 1) {
      fetchComments(page, false);
    }
  }, [page, fetchComments]);

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
            <span className="material-symbols-outlined text-lg text-slate-500">forum</span>
            Bình luận ({totalCount})
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
              <div key={index} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-b-0 animate-pulse">
                <div className="h-6 w-11 rounded bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-1/3 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-16 bg-slate-100 rounded shrink-0" />
              </div>
            ))}
          </div>
        ) : !comments.length ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 py-10">
            <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">chat_bubble_outline</span>
            Chưa có bình luận nào
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 overflow-y-auto pr-1 scrollbar-thin">
            <div className="divide-y divide-slate-100">
              {comments.map((comment, index) => {
                const likes = comment.likeCount || 0;
                const isLast = index === comments.length - 1;

                return (
                  <div
                    key={comment._id}
                    ref={isLast ? lastElementRef : null}
                    className="flex items-start gap-3 py-3 transition-colors hover:bg-slate-50/30 first:pt-0 last:pb-0"
                  >
                    {/* Likes badge */}
                    <div
                      className={`flex h-6 w-11 shrink-0 items-center justify-center gap-0.5 rounded border text-[10px] font-bold ${
                        likes > 0
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                      title={`${likes} lượt thích`}
                    >
                      <span className="material-symbols-outlined text-[10px] font-bold">favorite</span>
                      {likes}
                    </div>

                    {/* Comment Content & Post Link */}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs text-slate-700 font-medium">
                        {comment.content}
                      </p>

                      {comment.postId && (
                        <div className="mt-1 text-[11px] text-slate-400 flex items-center flex-wrap gap-2.5">
                          <span>
                            trong bài:{' '}
                            <Link
                              to={`/posts/${comment.postId}`}
                              className="font-medium text-slate-500 hover:text-blue-600 transition-colors inline hover:underline"
                            >
                              {comment.postTitle || 'Bài viết'}
                            </Link>
                          </span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <span className="material-symbols-outlined text-[12px]">visibility</span>
                            {(comment.postViewCount || 0).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right text-[11px] text-slate-400 mt-0.5">
                      {formatDate(comment.createdAt)}
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
