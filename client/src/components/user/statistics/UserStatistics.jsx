import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStatisticsThunk } from '../../../store/slices/statisticsSlice';
import StatsSummaryCards from './StatsSummaryCards';
import StatsTags from './StatsTags';
import StatsReputation from './StatsReputation';
import StatsVotes from './StatsVotes';
import StatsReactions from './StatsReactions';

// ====================================================================
// USER STATISTICS - Component chính tổng hợp tất cả thống kê
// Bố cục lấy cảm hứng từ StackOverflow Activity tab
// ====================================================================

export default function UserStatistics() {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.statistics);

  useEffect(() => {
    dispatch(fetchStatisticsThunk(12));
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton summary cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        {/* Skeleton columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="space-y-6 lg:col-span-1">
            <div className="h-60 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-60 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-10">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={() => dispatch(fetchStatisticsThunk(12))}
          className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    summary,
    topTags = [],
    votesGiven = { upvoted: 0, downvoted: 0, total: 0 },
    reactionsGiven = { liked: 0, disliked: 0, total: 0 },
  } = data;

  return (
    <div className="space-y-6">
      {/* Thông tin thành viên & Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-blue-600">analytics</span>
          Tóm tắt hoạt động
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          Thành viên từ:{' '}
          <span className="font-semibold text-slate-700">
            {summary?.memberSince
              ? new Date(summary.memberSince).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '—'}
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <StatsSummaryCards summary={summary} />

      {/* 3-column metrics layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsReputation />
        <StatsTags topTags={topTags} />
        <div className="space-y-6">
          <StatsVotes votesGiven={votesGiven} />
          <StatsReactions reactionsGiven={reactionsGiven} />
        </div>
      </div>
    </div>
  );
}
