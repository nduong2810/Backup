import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppPagination from '../../components/common/AppPagination';
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

const needsReason = (status) => ['resolved', 'unresolved'].includes(status);

export default function AdminPostsTab({ embedded = false }) {
  const [colWidths, setColWidths] = useState({
    post: 360,
    author: 180,
    upvotes: 90,
    comments: 110,
    status: 190,
    actions: 280,
  });

  const handleMouseDown = (colKey, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = colWidths[colKey];

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX);
      setColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (colKey) => {
    const cells = document.querySelectorAll(`[data-col="${colKey}"]`);
    let maxWidth = 80;
    cells.forEach((cell) => {
      const contentEl = cell.querySelector('.w-max');
      if (contentEl) {
        const contentWidth = contentEl.scrollWidth + 42;
        if (contentWidth > maxWidth) maxWidth = contentWidth;
      } else {
        // Measure natural content width via off-screen clone
        const clone = cell.cloneNode(true);
        Object.assign(clone.style, { position: 'absolute', left: '-9999px', top: '0', width: 'max-content', visibility: 'hidden', pointerEvents: 'none' });
        clone.querySelectorAll('.truncate, .line-clamp-2, .line-clamp-3').forEach((el) => {
          Object.assign(el.style, { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', webkitLineClamp: 'unset', display: 'block' });
        });
        document.body.appendChild(clone);
        const contentWidth = clone.scrollWidth + 12;
        document.body.removeChild(clone);
        if (contentWidth > maxWidth) maxWidth = contentWidth;
      }
    });
    const finalWidth = Math.min(600, Math.max(80, maxWidth));
    setColWidths((prev) => ({
      ...prev,
      [colKey]: finalWidth,
    }));
  };

  const totalWidth = useMemo(() => Object.values(colWidths).reduce((a, b) => a + b, 0), [colWidths]);

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
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reasonText, setReasonText] = useState('');

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

  const applyPostStatus = async (post, nextStatus, reason = '') => {
    if (!post?._id || updatingId || post.status === nextStatus) return;

    setUpdatingId(post._id);
    setError('');

    try {
      const response = await updateAdminPostStatus(post._id, nextStatus, reason);
      const updatedPost = response?.data?.data || {};

      setPosts((current) => current.map((item) => (
        item._id === post._id
          ? {
              ...item,
              ...updatedPost,
              status: nextStatus,
              statusReason: updatedPost.statusReason ?? reason ?? item.statusReason,
              statusChangedAt: updatedPost.statusChangedAt ?? new Date().toISOString(),
              statusChangedByRole: updatedPost.statusChangedByRole ?? (needsReason(nextStatus) ? 'admin' : item.statusChangedByRole),
            }
          : item
      )));

      setRecentlyUpdatedId(post._id);
      window.setTimeout(() => setRecentlyUpdatedId(''), 900);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Không thể cập nhật trạng thái bài đăng.');
    } finally {
      setUpdatingId('');
      setReasonDialog(null);
      setReasonText('');
    }
  };

  const handleSetPostStatus = async (post, nextStatus) => {
    if (!post?._id || updatingId || post.status === nextStatus) return;

    if (needsReason(nextStatus)) {
      setReasonDialog({ post, nextStatus });
      setReasonText('');
      setError('');
      return;
    }

    await applyPostStatus(post, nextStatus);
  };

  const handleConfirmReason = async () => {
    const reason = reasonText.trim();
    if (!reason) {
      setError('Vui lòng nhập lý do đóng/mở bài viết.');
      return;
    }

    if (reason.length > 500) {
      setError('Lý do tối đa 500 ký tự.');
      return;
    }

    await applyPostStatus(reasonDialog.post, reasonDialog.nextStatus, reason);
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), pagination.totalPages || 1);
    setPagination((prev) => ({ ...prev, page: safePage }));
  };

  return (
    <section className={embedded ? 'flex flex-col gap-6' : 'mx-auto w-full max-w-[1280px] px-6 py-8 flex flex-col gap-6'}>
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">article</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Quản lý bài đăng</h1>
              <p className="mt-1.5 text-sm text-slate-500">Kiểm duyệt, khóa, ẩn hoặc khôi phục các bài đăng của thành viên trên diễn đàn.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto scrollbar-custom pb-2">
          <table className="table-fixed w-full divide-y divide-slate-100" style={{ minWidth: `${totalWidth}px` }}>
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden align-middle" style={{ width: `${colWidths.post}px` }} data-col="post">
                  <div className="w-max">Bài đăng</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('post', e)}
                    onDoubleClick={() => handleDoubleClick('post')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden align-middle" style={{ width: `${colWidths.author}px` }} data-col="author">
                  <div className="w-max">Tác giả</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('author', e)}
                    onDoubleClick={() => handleDoubleClick('author')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden text-center align-middle" style={{ width: `${colWidths.upvotes}px` }} data-col="upvotes">
                  <div className="w-max mx-auto">Upvote</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('upvotes', e)}
                    onDoubleClick={() => handleDoubleClick('upvotes')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden text-center align-middle" style={{ width: `${colWidths.comments}px` }} data-col="comments">
                  <div className="w-max mx-auto">Bình luận</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('comments', e)}
                    onDoubleClick={() => handleDoubleClick('comments')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden text-center align-middle" style={{ width: `${colWidths.status}px` }} data-col="status">
                  <div className="w-max mx-auto">Trạng thái</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => handleDoubleClick('status')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
                <th className="relative px-5 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden text-center align-middle" style={{ width: `${colWidths.actions}px` }} data-col="actions">
                  <div className="w-max mx-auto">Thao tác</div>
                  <div
                    onMouseDown={(e) => handleMouseDown('actions', e)}
                    onDoubleClick={() => handleDoubleClick('actions')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                    title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                  />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-5" data-col="post"><div className="h-4 w-64 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5" data-col="author"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5" data-col="upvotes"><div className="mx-auto h-4 w-10 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5" data-col="comments"><div className="mx-auto h-4 w-10 rounded bg-slate-100" /></td>
                    <td className="px-5 py-5" data-col="status"><div className="mx-auto h-7 w-40 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-5" data-col="actions"><div className="mx-auto h-9 w-44 rounded-full bg-slate-100" /></td>
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
                    <td className="px-5 py-5 align-top overflow-hidden" data-col="post">
                      <div>
                        <Link
                          to={`/posts/${post._id}`}
                          className="line-clamp-2 text-sm font-bold leading-6 text-slate-900 transition hover:text-primary break-words"
                          title={post.title}
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
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top overflow-hidden" data-col="author">
                      <div>
                        <div
                          className="truncate text-sm font-semibold leading-6 text-slate-700"
                          title={post.author?.fullName || post.authorLabel || 'Không rõ tác giả'}
                        >
                          {post.author?.fullName || post.authorLabel || 'Không rõ tác giả'}
                        </div>
                        <div
                          className="truncate text-xs leading-5 text-slate-400"
                          title={post.author?.email || '—'}
                        >
                          {post.author?.email || '—'}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-center align-middle text-sm font-extrabold text-slate-800 overflow-hidden" data-col="upvotes">
                      <div className="w-max mx-auto">
                        {post.upvoteCount || 0}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-center align-middle text-sm font-extrabold text-slate-800 overflow-hidden" data-col="comments">
                      <div className="w-max mx-auto">
                        {post.commentCount || 0}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-center align-middle overflow-hidden" data-col="status">
                      <div className="w-max mx-auto">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold leading-none ${
                            STATUS_STYLES[post.status] || 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {STATUS_LABELS[post.status] || post.status}
                        </span>
                        {post.statusReason && (
                          <p className="mx-auto mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500 break-words" title={post.statusReason}>
                            Lý do: {post.statusReason}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-center align-middle overflow-hidden" data-col="actions">
                      <div className="w-max mx-auto">
                        <div className="flex flex-wrap justify-center gap-2 w-[190px] mx-auto">
                          {actions.map((action) => (
                            <button
                              key={`${post._id}-${action.status}`}
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleSetPostStatus(post, action.status)}
                              className={`group inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-extrabold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <AppPagination
            page={pagination.page}
            totalPages={pagination.totalPages || 1}
            onPageChange={goToPage}
            limit={pagination.limit}
            limitOptions={[10, 20, 50]}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
          <div className="mt-2 text-center sm:text-left text-xs font-semibold text-slate-500">
            Tổng <span className="text-slate-900">{pagination.total || 0}</span> bài đăng
          </div>
        </div>
      </div>

      {reasonDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => { setReasonDialog(null); setReasonText(''); }}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Đóng"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined">{reasonDialog.nextStatus === 'resolved' ? 'lock' : 'lock_open'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-900">
                  {reasonDialog.nextStatus === 'resolved' ? 'Khóa bài viết' : 'Mở lại bài viết'}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">{reasonDialog.post?.title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Lý do sẽ được lưu và hiển thị trên bài viết.</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Lý do</span>
              <textarea
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder={reasonDialog.nextStatus === 'resolved' ? 'Ví dụ: Bài đã có câu trả lời phù hợp, tạm khóa để tránh bình luận thêm...' : 'Ví dụ: Mở lại để tiếp tục thảo luận hoặc bổ sung thông tin...'}
              />
              <p className="mt-1 text-right text-xs text-slate-400">{reasonText.length}/500</p>
            </label>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => { setReasonDialog(null); setReasonText(''); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={handleConfirmReason}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
              >
                {updatingId ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}