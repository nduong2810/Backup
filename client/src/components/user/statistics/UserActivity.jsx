import { useState } from 'react';
import StatsPosts from './StatsPosts';
import StatsComments from './StatsComments';
import StatsInteractions from './StatsInteractions';

const TIME_RANGE_OPTIONS = [
  { key: 'all', label: 'Tất cả' },
  { key: '7days', label: '7 ngày qua' },
  { key: '30days', label: '30 ngày qua' },
  { key: '12months', label: '12 tháng qua' },
];

export default function UserActivity() {
  const [timeRange, setTimeRange] = useState('all');

  return (
    <div className="space-y-6 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-orange-500">history</span>
          Hoạt động gần đây
        </h2>

        {/* Bộ lọc thời gian */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto shadow-sm border border-slate-200/50 shrink-0">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeRange === opt.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Cấu trúc 3 cột hàng ngang cho các bảng hoạt động */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatsPosts timeRange={timeRange} />
        <StatsComments timeRange={timeRange} />
        <StatsInteractions timeRange={timeRange} />
      </div>
    </div>
  );
}


