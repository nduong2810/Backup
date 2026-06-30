import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCollectionThunk,
  deleteCollectionThunk,
  fetchCollectionsThunk,
  fetchSavedPostsThunk,
  moveSavedPostsThunk,
  removeSavedPostsThunk,
  renameCollectionThunk,
} from '../../store/slices/savedSlice';

function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="px-6 py-4 text-sm text-slate-600 leading-relaxed">{children}</div>
        <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
          {actions}
        </div>
      </div>
    </div>
  );
}

export default function SavedPostsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.login);
  const {
    collections,
    savedPosts,
    loadingCollections,
    loadingPosts,
    actionLoading,
    error,
  } = useSelector((state) => state.saved);

  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [targetCollectionId, setTargetCollectionId] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    dispatch(fetchCollectionsThunk());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    if (!collections.length) return;
    const exists = collections.some((item) => item._id === activeCollectionId);
    if (!activeCollectionId || !exists) {
      const timer = setTimeout(() => {
        setActiveCollectionId(collections[0]._id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [collections, activeCollectionId]);

  useEffect(() => {
    if (activeCollectionId) {
      dispatch(fetchSavedPostsThunk(activeCollectionId));
      const timer = setTimeout(() => {
        setSelectedPostIds([]);
        setTargetCollectionId('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [dispatch, activeCollectionId]);

  const activeCollection = useMemo(
    () => collections.find((item) => item._id === activeCollectionId),
    [collections, activeCollectionId]
  );
  const displayCollectionName = (collection) =>
    collection?.isDefault ? 'Lưu trữ' : collection?.name || '';

  const postIds = useMemo(
    () => savedPosts.map((item) => item.post?._id).filter(Boolean),
    [savedPosts]
  );

  const selectedCount = selectedPostIds.length;
  const allSelected = postIds.length > 0 && selectedCount === postIds.length;

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const result = await dispatch(createCollectionThunk(name));
    if (createCollectionThunk.fulfilled.match(result)) {
      setNewCollectionName('');
      dispatch(fetchCollectionsThunk());
    }
  };

  const handleRenameCollection = async (collectionId) => {
    const name = renamingValue.trim();
    if (!name) return;
    const result = await dispatch(renameCollectionThunk({ collectionId, name }));
    if (renameCollectionThunk.fulfilled.match(result)) {
      dispatch(fetchCollectionsThunk());
      setEditingCollectionId(null);
      setRenamingValue('');
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    const result = await dispatch(deleteCollectionThunk(collectionId));
    if (deleteCollectionThunk.fulfilled.match(result)) {
      dispatch(fetchCollectionsThunk());
      setDeletingCollection(null);
    }
  };

  const handleTogglePost = (postId) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedPostIds([]);
      return;
    }
    setSelectedPostIds(postIds);
  };

  const handleRemoveSelected = async () => {
    if (!selectedPostIds.length) return;
    const result = await dispatch(removeSavedPostsThunk(selectedPostIds));
    if (removeSavedPostsThunk.fulfilled.match(result)) {
      dispatch(fetchSavedPostsThunk(activeCollectionId));
      dispatch(fetchCollectionsThunk());
      setSelectedPostIds([]);
    }
  };

  const handleMoveSelected = async () => {
    if (!selectedPostIds.length || !targetCollectionId) return;
    const result = await dispatch(moveSavedPostsThunk({
      postIds: selectedPostIds,
      toCollectionId: targetCollectionId,
    }));
    if (moveSavedPostsThunk.fulfilled.match(result)) {
      await Promise.all([
        dispatch(fetchSavedPostsThunk(activeCollectionId)),
        dispatch(fetchCollectionsThunk()),
      ]);
      setSelectedPostIds([]);
      setTargetCollectionId('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pt-2 pb-8 flex flex-col gap-6">
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">folder_open</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cá nhân</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Thư mục lưu trữ</h1>
              <p className="mt-1.5 text-sm text-slate-500">Tạo thư mục riêng, lưu bài vào từng thư mục và quản lý nhanh hơn.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
        {/* Left column - Folders sidebar */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-slate-400">folder</span>
              Thư mục
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {collections.length}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tạo thư mục mới</label>
            <div className="flex gap-2">
              <input
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreateCollection()}
                placeholder="Ví dụ: React.js, Bug cần fix"
                className="flex-1 h-9 rounded-xl border border-slate-200 px-3 text-xs bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition"
              />
              <button
                type="button"
                onClick={handleCreateCollection}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition active:scale-95 shadow-sm"
              >
                Tạo
              </button>
            </div>
          </div>

          {loadingCollections && <p className="text-xs font-semibold text-slate-400">Đang tải thư mục...</p>}
          {!loadingCollections && collections.length === 0 && <p className="text-xs font-semibold text-slate-400">Chưa có thư mục.</p>}

          <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
            {collections.map((collection) => {
              const isActive = collection._id === activeCollectionId;
              return (
                <div
                  key={collection._id}
                  className={`rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                  onClick={() => setActiveCollectionId(collection._id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                        {isActive ? 'folder_open' : 'folder'}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                          {displayCollectionName(collection)}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{collection.total || 0} bài viết</p>
                      </div>
                    </div>
                    {!collection.isDefault && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingCollectionId(collection._id);
                            setRenamingValue(collection.name || '');
                          }}
                          title="Sửa tên thư mục"
                          className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingCollection(collection);
                          }}
                          title="Xóa thư mục"
                          className="p-1 rounded-lg text-slate-400 hover:text-error hover:bg-rose-50 transition"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400 leading-relaxed italic border-t border-slate-100 pt-3">
            * `Lưu trữ` là thư mục mặc định của hệ thống, không thể xóa.
          </p>
        </aside>

        {/* Right column - Saved posts list */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  {displayCollectionName(activeCollection) || 'Danh sách lưu'}
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {savedPosts.length} bài viết trong thư mục này
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  disabled={!postIds.length}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
                >
                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPostIds([])}
                  disabled={!selectedCount}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Đã chọn: <span className="text-sm font-extrabold text-slate-800">{selectedCount}</span> / {savedPosts.length} bài viết
              </span>

              <div className="relative ml-auto">
                <select
                  value={targetCollectionId}
                  onChange={(event) => setTargetCollectionId(event.target.value)}
                  className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-w-[220px] max-w-full shadow-sm"
                >
                  <option value="">Chuyển đến thư mục...</option>
                  {collections
                    .filter((collection) => collection._id !== activeCollectionId)
                    .map((collection) => (
                      <option key={collection._id} value={collection._id}>
                        {displayCollectionName(collection)}
                      </option>
                    ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  expand_more
                </span>
              </div>

              <button
                type="button"
                onClick={handleMoveSelected}
                disabled={!selectedCount || !targetCollectionId || actionLoading}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
              >
                Chuyển
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={!selectedCount || actionLoading}
                className="h-9 px-4 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
              >
                Xóa khỏi thư mục
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}
          {loadingPosts && <p className="text-sm font-semibold text-slate-400">Đang tải bài viết...</p>}

          {!loadingPosts && savedPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-255 bg-white p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">folder_open</span>
              <p className="text-sm font-semibold text-slate-700">Chưa có bài viết nào trong thư mục này.</p>
              <p className="text-xs text-slate-400 mt-2">Bạn có thể lưu bài từ trang danh sách hoặc trang chi tiết bài viết.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPosts.map((item) => {
              const postId = item.post?._id;
              const isChecked = postId ? selectedPostIds.includes(postId) : false;

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${
                    isChecked
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => postId && handleTogglePost(postId)}
                      disabled={!postId}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      {postId ? (
                        <Link
                          to={`/posts/${postId}`}
                          state={{ from: '/user/saves' }}
                          className="text-sm font-bold text-slate-800 hover:text-primary transition duration-150 line-clamp-2"
                        >
                          {item.post?.title || 'Bài viết không tồn tại'}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-slate-400 line-clamp-2">
                          Bài viết không tồn tại
                        </span>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.post?.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 mt-4 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {new Date(item.savedAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          {item.post?.viewCount || 0} lượt xem
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Edit collection name modal */}
      <Modal
        open={Boolean(editingCollectionId)}
        title="Đổi tên thư mục"
        onClose={() => {
          setEditingCollectionId(null);
          setRenamingValue('');
        }}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setEditingCollectionId(null);
                setRenamingValue('');
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => editingCollectionId && handleRenameCollection(editingCollectionId)}
              disabled={!renamingValue.trim() || actionLoading}
              className="rounded-xl bg-primary text-white px-4 py-2 text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              Lưu
            </button>
          </>
        }
      >
        <label htmlFor="rename-folder" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Tên thư mục mới
        </label>
        <input
          id="rename-folder"
          value={renamingValue}
          onChange={(event) => setRenamingValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && editingCollectionId) {
              handleRenameCollection(editingCollectionId);
            }
          }}
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          placeholder="Nhập tên thư mục"
        />
      </Modal>

      {/* Delete collection modal */}
      <Modal
        open={Boolean(deletingCollection)}
        title="Xóa thư mục"
        onClose={() => setDeletingCollection(null)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setDeletingCollection(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => deletingCollection && handleDeleteCollection(deletingCollection._id)}
              disabled={actionLoading}
              className="rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-bold hover:bg-rose-700 transition disabled:opacity-50"
            >
              Xóa thư mục
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn xóa thư mục <span className="font-bold text-slate-900">{deletingCollection?.name}</span>?
        </p>
        <p className="text-xs text-rose-500 font-semibold mt-2">
          * Tất cả bài viết nằm trong thư mục này cũng sẽ bị xóa.
        </p>
      </Modal>

      {/* Delete articles confirmation modal */}
      <Modal
        open={confirmRemoveOpen}
        title="Xóa bài viết khỏi thư mục"
        onClose={() => setConfirmRemoveOpen(false)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmRemoveOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleRemoveSelected();
                setConfirmRemoveOpen(false);
              }}
              disabled={!selectedCount || actionLoading}
              className="rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-bold hover:bg-rose-700 transition disabled:opacity-50"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn có chắc muốn xóa <span className="font-bold text-slate-900">{selectedCount}</span> bài viết khỏi thư mục này không?
        </p>
      </Modal>
    </div>
  );
}
