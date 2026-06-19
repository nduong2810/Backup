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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />
      <div className="relative w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
        <div className="border-b border-outline-variant px-5 py-4">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-4">
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Thư mục lưu trữ</h1>
        <p className="text-sm text-secondary">Tạo thư mục riêng, lưu bài vào từng thư mục và quản lý nhanh hơn.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-8">
        <aside className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-on-surface">Thư mục</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-surface-container-low text-secondary">
              {collections.length}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-DEFAULT p-3 mb-4 border border-outline-variant/60">
            <label className="block text-xs text-secondary mb-2">Tạo thư mục mới</label>
            <div className="flex gap-2">
              <input
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreateCollection()}
                placeholder="Ví dụ: React.js, Bug cần fix"
                className="flex-1 rounded-DEFAULT border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest"
              />
              <button
                type="button"
                onClick={handleCreateCollection}
                className="px-3 py-2 rounded-DEFAULT text-sm font-semibold bg-primary text-white hover:bg-primary/90"
              >
                Tạo
              </button>
            </div>
          </div>

          {loadingCollections && <p className="text-xs text-secondary">Đang tải thư mục...</p>}
          {!loadingCollections && collections.length === 0 && <p className="text-xs text-secondary">Chưa có thư mục.</p>}

          <div className="flex flex-col gap-2 max-h-[460px] overflow-auto pr-1">
            {collections.map((collection) => (
              <div
                key={collection._id}
                className={`rounded-DEFAULT border p-3 cursor-pointer transition-all ${
                  collection._id === activeCollectionId
                    ? 'border-primary bg-primary-container/15'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
                onClick={() => setActiveCollectionId(collection._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-on-surface">{displayCollectionName(collection)}</p>
                    <p className="text-xs text-secondary mt-1">{collection.total || 0} bài viết</p>
                  </div>
                  {!collection.isDefault && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingCollectionId(collection._id);
                          setRenamingValue(collection.name || '');
                        }}
                        className="text-xs text-secondary hover:text-primary"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeletingCollection(collection);
                        }}
                        className="text-xs text-error"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-secondary">
            `Lưu trữ` là thư mục mặc định của hệ thống, không thể xóa.
          </p>
        </aside>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-5 md:p-6">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">{displayCollectionName(activeCollection) || 'Danh sách lưu'}</h2>
                <p className="text-xs text-secondary mt-1">{savedPosts.length} bài viết trong thư mục này</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  disabled={!postIds.length}
                  className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low disabled:opacity-50"
                >
                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPostIds([])}
                  disabled={!selectedCount}
                  className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low disabled:opacity-50"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3 rounded-DEFAULT bg-surface-container-low border border-outline-variant/70">
              <span className="text-sm text-secondary">Đã chọn:</span>
              <span className="text-sm font-semibold text-on-surface">{selectedCount}</span>
              <span className="text-sm text-secondary">bài viết</span>

              <select
                value={targetCollectionId}
                onChange={(event) => setTargetCollectionId(event.target.value)}
                className="ml-auto rounded-DEFAULT border border-outline-variant px-3 py-1.5 text-sm bg-surface-container-lowest min-w-[220px] max-w-full"
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

              <button
                type="button"
                onClick={handleMoveSelected}
                disabled={!selectedCount || !targetCollectionId || actionLoading}
                className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low disabled:opacity-50"
              >
                Chuyển
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={!selectedCount || actionLoading}
                className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant text-error hover:bg-error-container/40 disabled:opacity-50"
              >
                Xóa khỏi thư mục
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-error mb-3">{error}</p>}
          {loadingPosts && <p className="text-sm text-secondary">Đang tải bài viết...</p>}

          {!loadingPosts && savedPosts.length === 0 && (
            <div className="rounded-DEFAULT border border-dashed border-outline-variant p-12 text-center">
              <p className="text-sm text-secondary">Chưa có bài viết nào trong thư mục này.</p>
              <p className="text-xs text-secondary mt-2">Bạn có thể lưu bài từ trang danh sách hoặc trang chi tiết bài viết.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedPosts.map((item) => {
              const postId = item.post?._id;
              const isChecked = postId ? selectedPostIds.includes(postId) : false;

              return (
                <article
                  key={item.id}
                  className={`border rounded-DEFAULT p-3 transition-colors ${
                    isChecked ? 'border-primary bg-primary-container/10' : 'border-outline-variant bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => postId && handleTogglePost(postId)}
                      disabled={!postId}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      {postId ? (
                        <Link
                          to={`/posts/${postId}`}
                          state={{ from: '/user/saves' }}
                          className="text-base font-semibold text-primary hover:text-primary/80 line-clamp-2"
                        >
                          {item.post?.title || 'Bài viết không tồn tại'}
                        </Link>
                      ) : (
                        <span className="text-base font-semibold text-secondary line-clamp-2">
                          Bài viết không tồn tại
                        </span>
                      )}
                      <p className="text-sm text-secondary line-clamp-3 mt-1">{item.post?.content}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-secondary mt-3">
                        <span>{new Date(item.savedAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span>{item.post?.viewCount || 0} lượt xem</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

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
              className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => editingCollectionId && handleRenameCollection(editingCollectionId)}
              disabled={!renamingValue.trim() || actionLoading}
              className="px-3 py-1.5 text-sm rounded-DEFAULT bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              Lưu
            </button>
          </>
        }
      >
        <label htmlFor="rename-folder" className="block text-sm text-secondary mb-2">
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
          className="w-full rounded-DEFAULT border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest"
          placeholder="Nhập tên thư mục"
        />
      </Modal>

      <Modal
        open={Boolean(deletingCollection)}
        title="Xóa thư mục"
        onClose={() => setDeletingCollection(null)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setDeletingCollection(null)}
              className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => deletingCollection && handleDeleteCollection(deletingCollection._id)}
              disabled={actionLoading}
              className="px-3 py-1.5 text-sm rounded-DEFAULT bg-error text-white hover:bg-error/90 disabled:opacity-50"
            >
              Xóa thư mục
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface">
          Bạn chắc chắn muốn xóa thư mục <span className="font-semibold">{deletingCollection?.name}</span>?
        </p>
        <p className="text-sm text-secondary mt-2">
          Tất cả bài viết nằm trong thư mục này cũng sẽ bị xóa.
        </p>
      </Modal>

      <Modal
        open={confirmRemoveOpen}
        title="Xóa bài viết khỏi thư mục"
        onClose={() => setConfirmRemoveOpen(false)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmRemoveOpen(false)}
              className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low"
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
              className="px-3 py-1.5 text-sm rounded-DEFAULT bg-error text-white hover:bg-error/90 disabled:opacity-50"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface">
          Bạn có chắc muốn xóa <span className="font-semibold">{selectedCount}</span> bài viết khỏi thư mục này không?
        </p>
      </Modal>
    </div>
  );
}
