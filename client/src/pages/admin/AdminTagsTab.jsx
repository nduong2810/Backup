import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTagsThunk,
  createTagThunk,
  updateTagThunk,
  deleteTagThunk,
  clearTagMessages
} from '../../store/slices/tagSlice';

const buildPaginationItems = (current, total) => {
  if (total <= 1) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);

  return items;
};

export default function AdminTagsTab() {
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

  const paginationItems = buildPaginationItems(currentPage, pagination.totalPages || 1);

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
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">label</span>
            Quản lý thẻ tag
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem, cập nhật mô tả thẻ tag, tạo thẻ tag mới và xóa các thẻ bị lỗi hoặc vi phạm.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="self-start sm:self-center flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg font-bold">add</span>
          Thêm thẻ mới
        </button>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <th className="px-6 py-4">Thẻ & Slug</th>
                    <th className="px-6 py-4">Mô tả</th>
                    <th className="px-6 py-4 text-center">Bài đăng</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {loading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-6 w-20 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-48 bg-slate-100 rounded" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-center">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-block self-start rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                              {tag.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              slug: {tag.slug}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {tag.description || 'Chưa có mô tả.'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {!loading && pagination && (pagination.totalPages > 1 || pagination.total > 8) && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {paginationItems.map((item, idx) => {
                    if (typeof item !== 'number') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">...</span>
                      );
                    }

                    const isActive = item === currentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg border text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="min-w-[32px] h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                      Sau
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span>mỗi trang</span>
                  <div className="flex items-center gap-1.5">
                    {[8, 15, 30].map((size) => {
                      const isActive = size === limit;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleLimitChange(size)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
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
