import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminPosts, updateAdminPostStatus } from '../../services/userService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả bài đăng' },
  { value: 'unresolved', label: 'Đang hiển thị' },
  { value: 'resolved', label: 'Đã khóa' },
  { value: 'hidden', label: 'Đang bị ẩn' },
  { value: 'deleted', label: 'Đã bị xóa' },
];

const STATUS_STYLES = {
  unresolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  resolved: 'border-amber-200 bg-amber-50 text-amber-700',
  hidden: 'border-sky-200 bg-sky-50 text-sky-700',
  deleted: 'border-rose-200 bg-rose-50 text-rose-700',
};

const STATUS_LABELS = {
  unresolved: 'Bài viết đang hiển thị',
  resolved: 'Bài viết đã bị khóa',
  hidden: 'Bài viết đang bị ẩn',
  deleted: 'Bài viết đã bị xóa',
};

const ACTION_CONFIG = {
  unresolved: [
    {
      status: 'resolved',
      label: 'Khóa',
      icon: 'lock',
      className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    },
    {
      status: 'hidden',
      label: 'Ẩn',
      icon: 'visibility_off',
      className: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    },
    {
      status: 'deleted',
      label: 'Xóa',
      icon: 'delete',
      className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    },
  ],
  resolved: [
    {
      status: 'unresolved',
      label: 'Mở khóa',
      icon: 'lock_open',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    },
    {
      status: 'hidden',
      label: 'Ẩn',
      icon: 'visibility_off',
      className: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    },
    {
      status: 'deleted',
      label: 'Xóa',
      icon: 'delete',
      className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    },
  ],
  hidden: [
    {
      status: 'unresolved',
      label: 'Hiện lại',
      icon: 'visibility',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    },
    {
      status: 'deleted',
      label: 'Xóa',
      icon: 'delete',
      className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    },
  ],
  deleted: [
    {
      status: 'unresolved',
      label: 'Khôi phục',
      icon: 'restore',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    },
  ],
};

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

export default function AdminPostsTab({ embedded = false }) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState('');

  const query = useMemo(() => ({
    page: pagination.page,
    limit: pagination.limit,
    keyword: appliedKeyword,
    status,
  }), [pagination.page, pagination.limit, appliedKeyword, status]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getAdminPosts(query);
      const data = response?.data?.data || {};

      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }));
    } catch (fetchError) {
      setPosts([]);
      setError(fetchError?.response?.data?.message || 'Không thể tải danh sách bài đăng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.keyword, query.status]);

  const handleApplySearch = (event) => {
    event?.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedKeyword(keyword.trim());
  };

  const handleStatusFilter = (event) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setStatus(event.target.value);
  };

  const handleSetPostStatus = async (post, nextStatus) => {
    if (!post?._id || updatingId || post.status === nextStatus) return;

    setUpdatingId(post._id);
    setError('');

    try {
      await updateAdminPostStatus(post._id, nextStatus);

      setPosts((current) => current.map((item) => (
        item._id === post._id ? { ...item, status: nextStatus } : item
      )));

      setRecentlyUpdatedId(post._id);
      window.setTimeout(() => setRecentlyUpdatedId(''), 900);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Không thể cập nhật trạng thái bài đăng.');
    } finally {
      setUpdatingId('');
    }
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), pagination.totalPages || 1);
    setPagination((prev) => ({ ...prev, page: safePage }));
  };

  return (
    <section className={embedded ? 'space-y-5' : 'mx-auto w-full max-w-[1280px] px-6 py-8'}>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Post Management
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-9 text-slate-900 sm:text-3xl">
              Quản lý bài đăng
            </h2>
          </div>

          <form
            onSubmit={handleApplySearch}
            className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr),220px,104px]"
          >
            <div className="relative min-w-0">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                search
              </span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tiêu đề..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="relative min-w-0">
              <select
                value={status}
                onChange={handleStatusFilter}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                expand_more
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                manage_search
              </span>
              Lọc
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="w-[360px] px-5 py-4 align-middle">Bài đăng</th>
                <th className="w-[240px] px-5 py-4 align-middle">Tác giả</th>
                <th className="w-[90px] px-5 py-4 text-center align-middle">Upvote</th>
                <th className="w-[110px] px-5 py-4 text-center align-middle">Bình luận</th>
                <th className="w-[190px] px-5 py-4 text-center align-middle">Trạng thái</th>
                <th className="w-[220px] px-5 py-4 text-right align-middle">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-5"><div className="h-4 w-64 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5"><div className="mx-auto h-4 w-10 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5"><div className="mx-auto h-4 w-10 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5"><div className="mx-auto h-7 w-40 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-5"><div className="ml-auto h-9 w-44 rounded-full bg-slate-100" /></td>
                  </tr>
                ))
              )}

              {!loading && posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <span className="material-symbols-outlined">article</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Không có bài đăng phù hợp.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Thử đổi từ khóa hoặc bộ lọc trạng thái.
                    </p>
                  </td>
                </tr>
              )}

              {!loading && posts.map((post) => {
                const isUpdating = updatingId === post._id;
                const isRecent = recentlyUpdatedId === post._id;
                const actions = ACTION_CONFIG[post.status] || ACTION_CONFIG.unresolved;

                return (
                  <tr
                    key={post._id}
                    className={`transition-all duration-300 hover:bg-slate-50 ${
                      isRecent ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <td className="px-5 py-5 align-top">
                      <Link
                        to={`/posts/${post._id}`}
                        className="line-clamp-2 max-w-[340px] text-sm font-bold leading-6 text-slate-900 transition hover:text-primary"
                      >
                        {post.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-5 text-slate-400">
                        <span className="font-medium">{formatDate(post.createdAt)}</span>
                        {post.postType && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                            {post.postType}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div
                        className="max-w-[220px] truncate text-sm font-semibold leading-6 text-slate-700"
                        title={post.author?.fullName || post.authorLabel || 'Không rõ tác giả'}
                      >
                        {post.author?.fullName || post.authorLabel || 'Không rõ tác giả'}
                      </div>
                      <div
                        className="max-w-[220px] truncate text-xs leading-5 text-slate-400"
                        title={post.author?.email || '—'}
                      >
                        {post.author?.email || '—'}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-center align-middle text-sm font-extrabold text-slate-800">
                      {post.upvoteCount || 0}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-center align-middle text-sm font-extrabold text-slate-800">
                      {post.commentCount || 0}
                    </td>

                    <td className="px-5 py-5 text-center align-middle">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold leading-none ${
                          STATUS_STYLES[post.status] || 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[post.status] || post.status}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right align-middle">
                      <div className="ml-auto grid w-[188px] grid-cols-2 gap-2">
                        {actions.map((action) => (
                          <button
                            key={`${post._id}-${action.status}`}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleSetPostStatus(post, action.status)}
                            className={`group inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-extrabold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                              actions.length === 1 ? 'col-span-2' : ''
                            } ${action.className}`}
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                                isUpdating ? 'animate-spin' : 'group-hover:rotate-6'
                              }`}
                            >
                              {isUpdating ? 'progress_activity' : action.icon}
                            </span>
                            <span className="whitespace-nowrap">
                              {isUpdating ? 'Đang xử lý' : action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Tổng <span className="text-slate-900">{pagination.total || 0}</span> bài đăng
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => goToPage(pagination.page - 1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>

            <span className="text-sm font-bold text-slate-700">
              {pagination.page || 1} / {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => goToPage(pagination.page + 1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
