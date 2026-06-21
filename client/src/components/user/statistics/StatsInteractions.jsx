import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecentVotesApi } from '../../../services/statisticsService';

const ACTION_BADGES = {
  upvote: { text: 'Upvoted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  downvote: { text: 'Downvoted', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  like: { text: 'Đã thích', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  dislike: { text: 'Không thích', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
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

export default function StatsInteractions({ timeRange = 'all' }) {
  const [votes, setVotes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'score' | 'newest' | 'views'
  const [totalCount, setTotalCount] = useState(0);

  const observer = useRef();
  const containerRef = useRef();

  const fetchVotes = useCallback(async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response = await getMyRecentVotesApi({ page: pageNum, limit: 10, sortBy, timeRange });
      const newVotes = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      setVotes((prev) => (isInitial ? newVotes : [...prev, ...newVotes]));
      setTotalCount(pagination.total || 0);
      setHasMore(pageNum < (pagination.totalPages || 1));
    } catch (err) {
      console.error('[StatsInteractions] Error fetching votes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, timeRange]);

  // Reset and fetch initial page when sortBy or timeRange changes
  useEffect(() => {
    setPage(1);
    fetchVotes(1, true);
  }, [sortBy, timeRange, fetchVotes]);


  useEffect(() => {
    if (page > 1) {
      fetchVotes(page, false);
    }
  }, [page, fetchVotes]);

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
            <span className="material-symbols-outlined text-lg text-slate-500">thumb_up</span>
            Tương tác gần đây ({totalCount})
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50/50 p-0.5 self-start shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSortBy(t.key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                sortBy === t.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>


      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        {loading && page === 1 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-b-0 animate-pulse">
                <div className="h-7 w-16 rounded bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-16 bg-slate-100 rounded shrink-0" />
              </div>
            ))}
          </div>
        ) : !votes.length ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-10">
            <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">thumb_up_down</span>
            Chưa có tương tác nào
          </div>
        ) : (
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-y-auto pr-1 space-y-3 scrollbar-thin"
          >
            <div className="divide-y divide-slate-100">
              {votes.map((vote, index) => {
                const isLast = index === votes.length - 1;
                const badge = ACTION_BADGES[vote.userAction] || { text: 'Tương tác', cls: 'bg-slate-50 text-slate-700 border-slate-100' };
                return (
                  <div
                    key={`${vote._id}_${index}`}
                    ref={isLast ? lastElementRef : null}
                    className="flex flex-col gap-2 py-3 transition-colors hover:bg-slate-50/30 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`inline-flex items-center rounded px-2 py-0.2 text-[9px] font-semibold border uppercase tracking-wider shrink-0 ${badge.cls}`}>
                        {badge.text}
                      </span>
                      <Link
                        to={`/posts/${vote._id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors block truncate"
                      >
                        {vote.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        {vote.viewCount?.toLocaleString() || 0}
                      </span>
                      {vote.postType === 'question' ? (
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">bar_chart</span>
                          Điểm: {vote.score || 0}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-blue-500/80">
                            <span className="material-symbols-outlined text-xs">thumb_up</span>
                            {vote.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-0.5 text-rose-500/80">
                            <span className="material-symbols-outlined text-xs">thumb_down</span>
                            {vote.dislikeCount || 0}
                          </span>
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-0.5">
                        {formatDate(vote.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {loadingMore && (
                <div className="py-3 flex justify-center">
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
