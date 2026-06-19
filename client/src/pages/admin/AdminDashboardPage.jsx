import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminDashboardStats } from '../../services/userService';
import AdminDonationsPage from './AdminDonationsPage';
import AdminFlagsPage from './AdminFlagsPage';
import AdminSettingsTab from './AdminSettingsTab';
import AdminTagsTab from './AdminTagsTab';
import AdminPostsTab from './AdminPostsTab';
import AdminUsersTab from './AdminUsersTab';

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: 'query_stats' },
  { key: 'donations', label: 'Duyệt bill COD', icon: 'payments' },
  { key: 'flags', label: 'Duyệt cờ báo cáo', icon: 'flag' },
  { key: 'users', label: 'Quản lý thành viên', icon: 'group' },
  { key: 'tags', label: 'Quản lý thẻ tag', icon: 'label' },
  { key: 'posts', label: 'Quản lý bài đăng', icon: 'article' },
  { key: 'settings', label: 'Cấu hình hệ thống', icon: 'settings' },
];

const VALID_TABS = TABS.map(t => t.key);

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const setActiveTab = useCallback((newTab) => {
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminDashboardStats();
      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Không thể lấy dữ liệu thống kê hệ thống.');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      const timer = setTimeout(() => {
        fetchStats();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchStats]);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const formatShortAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
    return amount;
  };

  // ====== SVG Line Chart ======
  const renderLineChart = (timeline) => {
    if (!timeline || timeline.length === 0) return null;
    const pad = { top: 30, right: 20, bottom: 35, left: 40 };
    const w = 480, h = 200;
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const maxVal = Math.max(...timeline.map(d => Math.max(d.users, d.posts)), 3);
    const getX = (i) => pad.left + (i * innerW) / (timeline.length - 1);
    const getY = (v) => pad.top + innerH - (v * innerH) / maxVal;

    const buildPath = (key) =>
      timeline.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ');

    const gridLines = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {gridLines.map((p, i) => {
          const val = Math.round(maxVal * p);
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3.5} textAnchor="end" className="text-[11px] fill-slate-400 font-medium">{val}</text>
            </g>
          );
        })}
        {timeline.map((d, i) => (
          <text key={i} x={getX(i)} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-500 font-semibold">
            {d.label}
          </text>
        ))}

        {/* Area fills */}
        <path
          d={`${buildPath('users')} L ${getX(timeline.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
          fill="#004e9f" fillOpacity="0.06"
        />
        <path
          d={`${buildPath('posts')} L ${getX(timeline.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
          fill="#10b981" fillOpacity="0.06"
        />

        {/* Lines */}
        <path d={buildPath('users')} fill="none" stroke="#004e9f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath('posts')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Vertical Guide Line on Hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)} y1={pad.top}
            x2={getX(hoveredIndex)} y2={pad.top + innerH}
            stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" pointerEvents="none"
          />
        )}

        {/* Dots */}
        {timeline.map((d, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.users)} r={isHovered ? 5.5 : 4} fill="#fff" stroke="#004e9f" strokeWidth={isHovered ? 3.5 : 2} />
              <circle cx={getX(i)} cy={getY(d.posts)} r={isHovered ? 5.5 : 4} fill="#fff" stroke="#10b981" strokeWidth={isHovered ? 3.5 : 2} />
            </g>
          );
        })}

        {/* Tooltip Overlay */}
        {hoveredIndex !== null && (
          <g pointerEvents="none">
            <rect
              x={Math.max(pad.left + 5, Math.min(w - pad.right - 125, getX(hoveredIndex) - 60))}
              y={pad.top - 28} width="120" height="42" fill="#1e293b" rx="6" opacity="0.95"
            />
            <text x={Math.max(pad.left + 65, Math.min(w - pad.right - 65, getX(hoveredIndex)))} y={pad.top - 15} textAnchor="middle" className="text-[10px] fill-white font-bold">
              Tháng {timeline[hoveredIndex].label}
            </text>
            <text x={Math.max(pad.left + 65, Math.min(w - pad.right - 65, getX(hoveredIndex)))} y={pad.top - 2} textAnchor="middle" className="text-[9px] fill-slate-300 font-semibold">
              User: {timeline[hoveredIndex].users} · Bài viết: {timeline[hoveredIndex].posts}
            </text>
          </g>
        )}

        {/* Invisible Vertical Hover Columns */}
        {timeline.map((d, i) => {
          const colW = innerW / (timeline.length - 1);
          const xStart = pad.left + i * colW - colW / 2;
          return (
            <rect key={i} x={i === 0 ? pad.left : xStart} y={pad.top}
              width={i === 0 || i === timeline.length - 1 ? colW / 2 : colW} height={innerH}
              fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>
    );
  };

  // ====== SVG Bar Chart ======
  const renderBarChart = (timeline) => {
    if (!timeline || timeline.length === 0) return null;
    const pad = { top: 20, right: 20, bottom: 35, left: 50 };
    const w = 480, h = 200;
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const maxVal = Math.max(...timeline.map(d => d.donationAmount), 50000);
    const barW = Math.max(14, innerW / timeline.length - 16);
    const getX = (i) => pad.left + (i * innerW) / timeline.length + (innerW / timeline.length - barW) / 2;
    const getY = (v) => pad.top + innerH - (v * innerH) / maxVal;

    const gridLines = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {gridLines.map((p, i) => {
          const val = Math.round(maxVal * p);
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3.5} textAnchor="end" className="text-[11px] fill-slate-400 font-medium">
                {formatShortAmount(val)}
              </text>
            </g>
          );
        })}
        {timeline.map((d, i) => (
          <text key={i} x={getX(i) + barW / 2} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-500 font-semibold">
            {d.label}
          </text>
        ))}
        {timeline.map((d, i) => {
          const x = getX(i);
          const y = getY(d.donationAmount);
          const barH = Math.max(1, pad.top + innerH - y);
          return (
            <g key={i} className="group">
              <rect x={x} y={y} width={barW} height={barH} fill="#004e9f" rx="3" className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="text-[10px] fill-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {formatShortAmount(d.donationAmount)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const getFlagStatusStyle = (status) => {
    const map = {
      submitted: 'bg-amber-50 text-amber-700 border-amber-200',
      received: 'bg-blue-50 text-blue-700 border-blue-200',
      in_review: 'bg-violet-50 text-violet-700 border-violet-200',
      action_taken: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      closed: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const pendingBadge = (key) => {
    if (!stats?.summary) return 0;
    if (key === 'donations') return stats.summary.pendingDonationsCount || 0;
    if (key === 'flags') return stats.summary.pendingFlagsCount || 0;
    return 0;
  };

  return (
    <main className="flex-1 min-w-0 pb-8">
      {/* Donations Tab */}
      {activeTab === 'donations' && <AdminDonationsPage embedded />}

      {/* Flags Tab */}
      {activeTab === 'flags' && <AdminFlagsPage embedded />}

      {/* Tags Tab */}
      {activeTab === 'tags' && <AdminTagsTab />}

      {/* Posts Tab */}
      {activeTab === 'posts' && <AdminPostsTab embedded />}

      {/* Users Tab */}
      {activeTab === 'users' && <AdminUsersTab embedded />}

      {/* Settings Tab */}
      {activeTab === 'settings' && <AdminSettingsTab />}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                <div className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thành viên</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl">group</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 mt-2 text-3xl">{stats.summary.totalUsers}</h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 font-semibold">Đăng ký trên diễn đàn</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài viết</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl">description</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 mt-2 text-3xl">{stats.summary.totalPosts}</h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 font-semibold">Chia sẻ & hỏi đáp</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cần kiểm duyệt</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl">gavel</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 mt-2 text-3xl">{stats.summary.pendingFlagsCount}</h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 font-semibold">Cờ vi phạm đang chờ xử lý</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quỹ ủng hộ</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl">account_balance_wallet</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 mt-2 text-xl truncate" title={formatCurrency(stats.summary.totalDonationAmount)}>
                    {formatCurrency(stats.summary.totalDonationAmount)}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 font-semibold">{stats.summary.totalDonationsCount} lượt ủng hộ</p>
                </div>
              </div>

              {/* Pending Items Banner */}
              {(stats.summary.pendingFlagsCount > 0 || stats.summary.pendingDonationsCount > 0) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-wrap items-center gap-4">
                  <span className="material-symbols-outlined text-amber-500 text-xl">pending_actions</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Hàng đợi cần xử lý</p>
                    <div className="flex items-center gap-4 mt-1 text-xs">
                      {stats.summary.pendingFlagsCount > 0 && (
                        <button onClick={() => setActiveTab('flags')} className="text-orange-600 font-bold hover:underline">
                          {stats.summary.pendingFlagsCount} cờ báo cáo
                        </button>
                      )}
                      {stats.summary.pendingDonationsCount > 0 && (
                        <button onClick={() => setActiveTab('donations')} className="text-primary font-bold hover:underline">
                          {stats.summary.pendingDonationsCount} bill chờ duyệt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Tăng trưởng hệ thống</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Thành viên mới và bài đăng qua các tháng</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-primary rounded-full" /> User mới</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Bài đăng</span>
                    </div>
                  </div>
                  {renderLineChart(stats.timeline)}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Doanh thu ủng hộ</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Dòng tiền quyên góp qua VNPay/COD</p>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold border border-slate-200 rounded-full px-2 py-0.5">VND</span>
                  </div>
                  {renderBarChart(stats.timeline)}
                </div>
              </div>

              {/* Distributions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Phân loại bài đăng</h3>
                  {(() => {
                    const q = stats.distributions.postType.question || 0;
                    const a = stats.distributions.postType.advice || 0;
                    const total = q + a;
                    const qPct = total > 0 ? Math.round((q / total) * 100) : 0;
                    const aPct = total > 0 ? 100 - qPct : 0;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">Hỏi đáp (Question)</span>
                          <span className="text-slate-500">{q} bài · {qPct}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">Chia sẻ (Advice)</span>
                          <span className="text-slate-500">{a} bài · {aPct}%</span>
                        </div>
                        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                          <div className="h-full bg-primary transition-all" style={{ width: `${qPct}%` }} />
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${aPct}%` }} />
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-full" /> Hỏi đáp</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Chia sẻ</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Tỷ lệ phản hồi bài viết</h3>
                  {(() => {
                    const answered = stats.distributions.postResponse?.answered || 0;
                    const unanswered = stats.distributions.postResponse?.unanswered || 0;
                    const total = answered + unanswered;
                    const answeredPct = total > 0 ? Math.round((answered / total) * 100) : 0;
                    const unansweredPct = total > 0 ? 100 - answeredPct : 0;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">Đã có phản hồi</span>
                          <span className="text-slate-500">{answered} bài · {answeredPct}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">Chưa có phản hồi</span>
                          <span className="text-slate-500">{unanswered} bài · {unansweredPct}%</span>
                        </div>
                        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${answeredPct}%` }} />
                          <div className="h-full bg-amber-500 transition-all" style={{ width: `${unansweredPct}%` }} />
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Đã trả lời/bình luận</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Chưa có phản hồi</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Recent Activity Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-slate-500 text-xl font-bold">flag</span>
                      Báo cáo gần đây
                    </h3>
                    <button onClick={() => setActiveTab('flags')} className="text-xs font-semibold text-primary hover:underline">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400">
                          <th className="pb-2 font-semibold">Bài viết</th>
                          <th className="pb-2 font-semibold">Lý do</th>
                          <th className="pb-2 font-semibold text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.recentFlags.length > 0 ? (
                          stats.recentFlags.map((flag) => (
                            <tr key={flag._id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 pr-2 max-w-[140px] truncate text-slate-700 font-semibold">
                                {flag.post ? (
                                  <a href={`/posts/${flag.post._id}`} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                                    {flag.post.title}
                                  </a>
                                ) : <span className="text-slate-400 font-normal">Đã ẩn/xóa</span>}
                              </td>
                              <td className="py-2.5 text-slate-500 font-medium">{flag.flagTypeLabel}</td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-block border text-xs font-semibold px-2.5 py-0.5 rounded-full ${getFlagStatusStyle(flag.status)}`}>
                                  {flag.statusLabel}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" className="py-4 text-center text-slate-400">Không có báo cáo mới.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-slate-500 text-xl font-bold">payments</span>
                      Ủng hộ gần đây
                    </h3>
                    <button onClick={() => setActiveTab('donations')} className="text-xs font-semibold text-primary hover:underline">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400">
                          <th className="pb-2 font-semibold">Người gửi</th>
                          <th className="pb-2 font-semibold">Tác giả</th>
                          <th className="pb-2 font-semibold text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.recentDonations.length > 0 ? (
                          stats.recentDonations.map((don) => (
                            <tr key={don._id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 pr-2 text-slate-700 font-semibold">
                                {don.donorSnapshot?.fullName || don.donor?.fullName || 'N/A'}
                              </td>
                              <td className="py-2.5 text-slate-500 font-medium">
                                {don.authorSnapshot?.fullName || don.author?.fullName || 'N/A'}
                              </td>
                              <td className="py-2.5 text-right font-bold text-primary">
                                {formatCurrency(don.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" className="py-4 text-center text-slate-400">Chưa có giao dịch hoàn thành.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Không thể tải dữ liệu thống kê.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
