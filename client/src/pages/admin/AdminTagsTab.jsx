import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppPagination from '../../components/common/AppPagination';
import {
  fetchTagsThunk,
  createTagThunk,
  updateTagThunk,
  deleteTagThunk,
  clearTagMessages
} from '../../store/slices/tagSlice';

export default function AdminTagsTab() {
  const [colWidths, setColWidths] = useState({
    tag: 220,
    desc: 380,
    posts: 120,
    actions: 140,
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
        const textWidth = cell.scrollWidth;
        if (textWidth > maxWidth) maxWidth = textWidth;
      }
    });
    const finalWidth = Math.min(600, Math.max(80, maxWidth));
    setColWidths((prev) => ({
      ...prev,
      [colKey]: finalWidth,
    }));
  };

  const totalWidth = useMemo(() => Object.values(colWidths).reduce((a, b) => a + b, 0), [colWidths]);

  const dispatch = useDispatch();

  // Redux state
  const { collections, saving, successMsg, errorMsg } = useSelector(state => state.tags);
  const collection = collections['admin'] || { items: [], loading: false, pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
  const { items: tags, loading, pagination } = collection;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortBy, setSortBy] = useState('posts');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null); // Tag object being edited
  const [deletingTag, setDeletingTag] = useState(null); // Tag object being deleted
  const isModalOpen = Boolean(deletingTag);

  // Form states
  const [tagName, setTagName] = useState('');
  const [tagDesc, setTagDesc] = useState('');


  // Fetch tags on change
  useEffect(() => {
    dispatch(
      fetchTagsThunk({
        key: 'admin',
        params: {
          search: searchTerm,
          page: currentPage,
          limit,
          sortBy,
        },
      })
    );
  }, [dispatch, searchTerm, currentPage, limit, sortBy]);

  // Handle messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        dispatch(clearTagMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg, dispatch]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    dispatch(createTagThunk({ name: tagName, description: tagDesc }))
      .unwrap()
      .then(() => {
        setTagName('');
        setTagDesc('');
        setIsCreateOpen(false);
        // Refresh tags
        dispatch(fetchTagsThunk({ key: 'admin', params: { search: searchTerm, page: currentPage, limit, sortBy } }));
      });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingTag || !tagName.trim()) return;

    dispatch(updateTagThunk({
      tagId: editingTag._id,
      payload: { name: tagName, description: tagDesc }
    }))
      .unwrap()
      .then(() => {
        setTagName('');
        setTagDesc('');
        setEditingTag(null);
        // Refresh tags
        dispatch(fetchTagsThunk({ key: 'admin', params: { search: searchTerm, page: currentPage, limit, sortBy } }));
      });
  };

  const handleDeleteConfirm = () => {
    if (!deletingTag) return;

    dispatch(deleteTagThunk(deletingTag._id))
      .unwrap()
      .then(() => {
        // Refresh tags
        dispatch(fetchTagsThunk({ key: 'admin', params: { search: searchTerm, page: currentPage, limit, sortBy } }));
      })
      .catch((err) => {
        console.error('Xóa thẻ tag thất bại:', err);
      })
      .finally(() => {
        setDeletingTag(null);
      });
  };

  const openCreateForm = () => {
    setTagName('');
    setTagDesc('');
    setEditingTag(null);
    setIsCreateOpen(true);
  };

  const openEditForm = (tag) => {
    setTagName(tag.name);
    setTagDesc(tag.description || '');
    setEditingTag(tag);
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">label</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Quản lý thẻ tag</h1>
              <p className="mt-1.5 text-sm text-slate-500">Xem, cập nhật mô tả thẻ tag, tạo thẻ tag mới và xóa các thẻ bị lỗi hoặc vi phạm.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={openCreateForm}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Thêm thẻ mới
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 transition-all animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 transition-all animate-fadeIn">
          <span className="material-symbols-outlined text-rose-600">error</span>
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên tag hoặc slug..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="relative w-full sm:w-60 flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full appearance-none rounded-xl border border-slate-300 pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white cursor-pointer"
          >
            <option value="posts">Sắp xếp: Số bài đăng</option>
            <option value="name">Sắp xếp: Tên chữ cái</option>
            <option value="newest">Sắp xếp: Mới nhất</option>
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            expand_more
          </span>
        </div>
      </div>

      {/* Grid Form or Table list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form (Create/Edit) */}
        {(isCreateOpen || editingTag) && (
          <div className="lg:col-span-1 h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-lg text-slate-500">
                {editingTag ? 'edit_note' : 'add_circle'}
              </span>
              {editingTag ? 'Chỉnh sửa thẻ tag' : 'Tạo thẻ tag mới'}
            </h3>
            <form onSubmit={editingTag ? handleUpdateSubmit : handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Tên thẻ tag
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ReactJS, Python..."
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  disabled={saving}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Mô tả chi tiết
                </label>
                <textarea
                  placeholder="Mô tả công nghệ hoặc chủ đề của thẻ tag này..."
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  disabled={saving}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-600 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTag(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Column: Tags Table */}
        <div className={(isCreateOpen || editingTag) ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto scrollbar-custom pb-2">
              <table className="table-fixed w-full border-collapse text-left text-sm text-slate-600" style={{ minWidth: `${totalWidth}px` }}>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <th className="relative px-6 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.tag}px` }} data-col="tag">
                      <div className="w-max">Thẻ & Slug</div>
                      <div
                        onMouseDown={(e) => handleMouseDown('tag', e)}
                        onDoubleClick={() => handleDoubleClick('tag')}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                        title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                      />
                    </th>
                    <th className="relative px-6 py-4 select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.desc}px` }} data-col="desc">
                      <div className="w-max">Mô tả</div>
                      <div
                        onMouseDown={(e) => handleMouseDown('desc', e)}
                        onDoubleClick={() => handleDoubleClick('desc')}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                        title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                      />
                    </th>
                    <th className="relative px-6 py-4 text-center select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.posts}px` }} data-col="posts">
                      <div className="w-max mx-auto">Bài đăng</div>
                      <div
                        onMouseDown={(e) => handleMouseDown('posts', e)}
                        onDoubleClick={() => handleDoubleClick('posts')}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-10"
                        title="Kéo hoặc nhấp đúp để tự động chỉnh độ rộng"
                      />
                    </th>
                    <th className="relative px-6 py-4 text-center select-none border-r border-slate-200/50 last:border-r-0 overflow-hidden" style={{ width: `${colWidths.actions}px` }} data-col="actions">
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
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {loading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4" data-col="tag">
                          <div className="h-6 w-20 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4" data-col="desc">
                          <div className="h-4 w-48 bg-slate-100 rounded" />
                        </td>
                        <td className="px-6 py-4 text-center" data-col="posts">
                          <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-center" data-col="actions">
                          <div className="h-8 w-16 bg-slate-100 rounded mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Không tìm thấy thẻ tag nào.
                      </td>
                    </tr>
                  ) : (
                    tags.map(tag => (
                      <tr key={tag._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden" data-col="tag">
                          <div className="w-max">
                            <div className="flex flex-col gap-1">
                              <span className="inline-block self-start rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                                {tag.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                slug: {tag.slug}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 overflow-hidden" data-col="desc">
                          <div className="w-max">
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" title={tag.description || 'Chưa có mô tả.'}>
                              {tag.description || 'Chưa có mô tả.'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap overflow-hidden" data-col="posts">
                          <div className="w-max mx-auto">
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-sm font-extrabold text-slate-800">
                                {tag.totalCount || 0}
                              </span>
                              {tag.todayCount > 0 && (
                                <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1 py-0.5 rounded-full mt-0.5">
                                  +{tag.todayCount} hôm nay
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap overflow-hidden" data-col="actions">
                          <div className="w-max mx-auto">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(tag)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                title="Chỉnh sửa mô tả"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingTag(tag)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
                                title="Xóa tag khỏi hệ thống"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {!loading && pagination && pagination.total > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <AppPagination
                  page={currentPage}
                  totalPages={pagination.totalPages || 1}
                  onPageChange={setCurrentPage}
                  limit={limit}
                  limitOptions={[8, 15, 30]}
                  onLimitChange={handleLimitChange}
                />
                <div className="mt-2 text-center sm:text-left text-xs font-semibold text-slate-500">
                  Tổng <span className="text-slate-900">{pagination.total || 0}</span> thẻ tag
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTag && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-xl font-bold">warning</span>
              Xác nhận xóa thẻ tag?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thẻ tag <span className="font-extrabold text-slate-800">#{deletingTag.name}</span>? 
              Hành động này sẽ xóa vĩnh viễn thẻ này khỏi hệ thống. Lưu ý: Chỉ có thể xóa thẻ tag khi không có bài viết nào đang sử dụng.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-all"
              >
                {saving ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
              <button
                onClick={() => setDeletingTag(null)}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
