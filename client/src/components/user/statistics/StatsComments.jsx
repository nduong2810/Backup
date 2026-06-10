import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StatsComments({ comments = [] }) {
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'newest'

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortBy === 'score') {
      return list.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [comments, sortBy]);

  const tabs = [
    { key: 'score', label: 'Điểm số' },
    { key: 'newest', label: 'Mới nhất' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header section with sort tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xl text-slate-500">forum</span>
            Bình luận ({comments.length})
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
      {!sortedComments.length ? (
        <div className="flex h-36 flex-col items-center justify-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">chat_bubble_outline</span>
          Chưa có bình luận nào
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sortedComments.map((comment) => {
            const likes = comment.likeCount || 0;

            return (
              <div key={comment._id} className="flex items-start gap-3 py-3 transition-colors hover:bg-slate-50/30 first:pt-0 last:pb-0">
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
                    <div className="mt-1 text-[11px] text-slate-400">
                      trong bài:{' '}
                      <Link
                        to={`/posts/${comment.postId}`}
                        className="font-medium text-slate-500 hover:text-blue-600 transition-colors inline hover:underline"
                      >
                        {comment.postTitle || 'Bài viết'}
                      </Link>
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
        </div>
      )}
    </div>
  );
}
