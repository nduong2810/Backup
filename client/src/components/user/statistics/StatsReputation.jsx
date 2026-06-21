import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecentReputationApi } from '../../../services/statisticsService';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StatsReputation() {
  const [reputationChanges, setReputationChanges] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const observer = useRef();
  const containerRef = useRef();

  const fetchReputation = useCallback(async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response = await getMyRecentReputationApi({ page: pageNum, limit: 10 });
      const newChanges = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      setReputationChanges((prev) => (isInitial ? newChanges : [...prev, ...newChanges]));
      setTotalCount(pagination.total || 0);
      setHasMore(pageNum < (pagination.totalPages || 1));
    } catch (err) {
      console.error('[StatsReputation] Error fetching reputation history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchReputation(1, true);
  }, [fetchReputation]);

  useEffect(() => {
    if (page > 1) {
      fetchReputation(page, false);
    }
  }, [page, fetchReputation]);

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[480px] lg:h-full">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-slate-500">military_tech</span>
          Lịch sử uy tín gần đây ({totalCount})
        </h3>
      </div>

      {/* List Area */}
      <div className="flex-1 min-h-0 relative">
        {loading && page === 1 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : !reputationChanges.length ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 py-10">
            <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">military_tech</span>
            Chưa có biến động uy tín nào
          </div>
        ) : (
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-y-auto pr-1 space-y-3 scrollbar-thin"
          >
            {reputationChanges.map((change, index) => {
              const rep = change.reputationEarned ?? 0;
              const isPositive = rep > 0;
              const isNeutral = rep === 0;
              const isPostEvent = change.type?.startsWith('post_');
              const isLast = index === reputationChanges.length - 1;

              let displayMsg = '';
              if (change.type === 'post_upvoted') {
                displayMsg = 'Nhận upvote cho bài viết:';
              } else if (change.type === 'post_upvote_removed') {
                displayMsg = 'Huỷ upvote cho bài viết:';
              } else if (change.type === 'post_downvoted') {
                displayMsg = 'Nhận downvote cho bài viết:';
              } else if (change.type === 'post_downvote_removed') {
                displayMsg = 'Huỷ downvote cho bài viết:';
              } else if (change.type === 'downvote_given') {
                displayMsg = 'Bị trừ điểm gửi downvote:';
              } else if (change.type === 'downvote_given_removed') {
                displayMsg = 'Hoàn điểm gửi downvote:';
              } else if (change.type === 'donate_received') {
                displayMsg = 'Giao dịch:';
              } else {
                displayMsg = 'Biến động uy tín:';
              }

              const postId = change._id.split('_')[0];

              return (
                <div
                  key={`${change._id}_${index}`}
                  ref={isLast ? lastElementRef : null}
                  className="flex items-center gap-3 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 transition-colors hover:bg-slate-50/50"
                >
                  {/* Score */}
                  <div
                    className={`flex shrink-0 items-center justify-center rounded border px-2 py-0.5 text-xs font-bold ${
                      isPositive
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : isNeutral
                        ? 'bg-slate-100 border-slate-200 text-slate-500'
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}
                  >
                    {isPositive ? `+${rep}` : rep}
                  </div>

                  {/* Event description */}
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="text-slate-500">{displayMsg} </span>
                    {isPostEvent ? (
                      <Link
                        to={`/posts/${postId}`}
                        className="font-semibold text-slate-700 hover:text-blue-600 hover:underline transition-colors block truncate mt-0.5"
                      >
                        {change.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-700 block truncate mt-0.5">
                        {change.title}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="shrink-0 text-right text-[10px] text-slate-400">
                    {formatDate(change.createdAt)}
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="py-3 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
