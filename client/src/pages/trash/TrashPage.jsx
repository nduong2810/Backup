import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrashPosts, restorePost, permanentlyDeletePost } from '../../services/postService';
import { useToast } from '../../context/ToastContext';

export default function TrashPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [actionType, setActionType] = useState(''); // 'restore' | 'delete'
  const [processing, setProcessing] = useState(false);

  const { toast } = useToast();

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const response = await getTrashPosts();
      setPosts(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('[TrashPage] Fetch error:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách bài viết đã xóa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const openConfirmModal = (postId, type) => {
    setSelectedPostId(postId);
    setActionType(type);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setSelectedPostId(null);
    setActionType('');
    setShowConfirmModal(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedPostId || processing) return;
    setProcessing(true);
    try {
      if (actionType === 'restore') {
        await restorePost(selectedPostId);
        toast.success('Khôi phục bài viết thành công!');
      } else if (actionType === 'delete') {
        await permanentlyDeletePost(selectedPostId);
        toast.success('Đã xóa vĩnh viễn bài viết thành công!');
      }
      closeConfirmModal();
      fetchTrash();
    } catch (err) {
      console.error(`[TrashPage] Error performing ${actionType}:`, err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateDaysLeft = (deletedAtStr) => {
    if (!deletedAtStr) return 7;
    const deletedDate = new Date(deletedAtStr);
    const expireDate = new Date(deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffTime = expireDate - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
        <p className="text-body-sm text-secondary">Đang tải thùng rác...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pt-2 pb-8 flex flex-col gap-6 min-w-0 flex-1">
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-2xl font-bold">delete</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cá nhân</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Thùng rác</h1>
              <p className="mt-1.5 text-sm text-slate-500">Danh sách các bài viết bạn đã xóa trong vòng 7 ngày qua.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Warning Box */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 shadow-sm">
        <span className="material-symbols-outlined text-amber-600 mt-0.5 text-xl">info</span>
        <p className="text-sm leading-relaxed font-semibold">
          Lưu ý: Bài viết nằm trong thùng rác quá 7 ngày kể từ lúc xóa sẽ tự động bị hệ thống dọn dẹp và xóa vĩnh viễn không thể khôi phục.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <span className="material-symbols-outlined text-3xl text-rose-500 mb-1">error</span>
          <p className="font-semibold text-sm">{error}</p>
          <button onClick={fetchTrash} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            Thử tải lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-350 bg-white text-slate-400 p-8 shadow-sm">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">auto_delete</span>
          <p className="text-sm font-semibold">Thùng rác trống</p>
          <p className="text-xs text-slate-400 mt-1">Các bài viết đã xóa sẽ được hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {posts.map((post) => {
              const daysLeft = calculateDaysLeft(post.deletedAt);
              return (
                <div key={post._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/40 transition-colors">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 break-words">
                      {post.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        Đã xóa: {formatDate(post.deletedAt)}
                      </span>
                      <span className={`flex items-center gap-1 font-bold ${daysLeft <= 2 ? 'text-rose-500' : 'text-amber-600'}`}>
                        <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                        {post.deletedBy && post.deletedBy !== 'owner' 
                          ? `Sẽ bị xóa vĩnh viễn sau ${daysLeft} ngày` 
                          : `Còn ${daysLeft} ngày để khôi phục`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {post.deletedBy && post.deletedBy !== 'owner' ? (
                      <span 
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm cursor-help"
                        title={post.deletedBy === 'report' ? 'Bài viết tự động bị ẩn/xóa do nhận đủ số cờ báo cáo vi phạm từ cộng đồng.' : 'Bài viết bị xóa theo quyết định của quản trị viên.'}
                      >
                        <span className="material-symbols-outlined text-base text-rose-500">warning</span>
                        {post.deletedBy === 'report' ? 'Bị báo cáo' : 'Admin đã xóa'}
                      </span>
                    ) : (
                      <button
                        onClick={() => openConfirmModal(post._id, 'restore')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100/80"
                      >
                        <span className="material-symbols-outlined text-base">settings_backup_restore</span>
                        Khôi phục
                      </button>
                    )}
                    <button
                      onClick={() => openConfirmModal(post._id, 'delete')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-250 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100/80"
                    >
                      <span className="material-symbols-outlined text-base">delete_forever</span>
                      Xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeConfirmModal}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm cursor-default"
            aria-label="Đóng"
          />
          {/* Modal box */}
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${actionType === 'restore' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <span className="material-symbols-outlined">
                  {actionType === 'restore' ? 'restore_from_trash' : 'warning'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  {actionType === 'restore' ? 'Khôi phục bài viết?' : 'Xóa vĩnh viễn bài viết?'}
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {actionType === 'restore'
                    ? 'Bài viết này sẽ được khôi phục trở lại diễn đàn và hiển thị bình thường như trước.'
                    : 'Hành động này không thể hoàn tác. Bài viết và tất cả bình luận bên trong sẽ bị xóa vĩnh viễn khỏi hệ thống.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={processing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={processing}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${actionType === 'restore' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {processing ? 'Đang xử lý...' : actionType === 'restore' ? 'Xác nhận khôi phục' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
