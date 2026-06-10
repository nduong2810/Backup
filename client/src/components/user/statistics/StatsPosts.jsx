import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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

export default function StatsPosts({ posts = [] }) {
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'newest' | 'views'

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    if (sortBy === 'score') {
      return list.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    }
    if (sortBy === 'views') {
      return list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [posts, sortBy]);

  const tabs = [
    { key: 'score', label: 'Điểm số' },
    { key: 'newest', label: 'Mới nhất' },
    { key: 'views', label: 'Lượt xem' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header section with sort tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xl text-slate-500">article</span>
            Bài viết ({posts.length})
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50/50 p-0.5">
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
      {!sortedPosts.length ? (
        <div className="flex h-36 flex-col items-center justify-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">drafts</span>
          Chưa có bài viết nào
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sortedPosts.map((post) => {
            const score = post.upvoteCount || 0;
            const badge = TYPE_BADGES[post.postType] || TYPE_BADGES.question;

            return (
              <div key={post._id} className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/30 first:pt-0 last:pb-0">
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
        </div>
      )}
    </div>
  );
}
