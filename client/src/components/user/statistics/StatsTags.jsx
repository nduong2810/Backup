import { useMemo, useState } from 'react';

export default function StatsTags({ topTags = [] }) {
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'name'

  const sortedTags = useMemo(() => {
    const list = [...topTags];
    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.count || 0) - (a.count || 0));
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [topTags, sortBy]);

  const tabs = [
    { key: 'popular', label: 'Số lượng' },
    { key: 'name', label: 'Tên thẻ' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header section with sort tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-slate-500">sell</span>
          Thẻ quan tâm ({topTags.length})
        </h3>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
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

      {/* Grid of tags */}
      {!sortedTags.length ? (
        <div className="flex h-36 flex-col items-center justify-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">sell</span>
          Chưa gắn thẻ bài viết nào
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sortedTags.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1.5 transition-colors hover:bg-slate-100/50"
            >
              <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer select-none">
                {tag.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400">x {tag.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
