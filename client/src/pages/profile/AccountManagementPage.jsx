import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { logout } from '../../store/slices/loginSlice';
import { deactivateMyAccount, deleteMyAccount } from '../../services/userService';

export default function AccountManagementPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDeactivateAccount = async () => {
    try {
      setActionLoading(true);
      const res = await deactivateMyAccount();
      toast.success(res.data.message || 'Vô hiệu hóa tài khoản thành công!');
      setShowDeactivateConfirm(false);
      dispatch(logout());
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi vô hiệu hóa tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setActionLoading(true);
      const res = await deleteMyAccount();
      toast.success(res.data.message || 'Tài khoản đã được đặt lịch chờ xóa!');
      setShowDeleteConfirm(false);
      dispatch(logout());
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu xóa tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pt-2 pb-8 flex flex-col gap-6">
      {/* Header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">manage_accounts</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cá nhân</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 leading-none">Quản lý tài khoản</h1>
              <p className="mt-1.5 text-sm text-slate-500">Cấu hình các thiết lập liên quan đến sự tồn tại tài khoản diễn đàn của bạn.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card Vô hiệu hóa tài khoản */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-amber-500">lock</span>
            Vô hiệu hóa tài khoản
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Tạm thời vô hiệu hóa tài khoản của bạn. Khi vô hiệu hóa tài khoản, hồ sơ cá nhân và tất cả các bài viết, bình luận của bạn sẽ bị tạm ẩn khỏi diễn đàn. 
              Bạn có thể kích hoạt lại tài khoản và phục hồi dữ liệu bất cứ lúc nào chỉ bằng cách đăng nhập lại và xác thực OTP.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
              >
                Vô hiệu hóa tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* Card Xóa tài khoản vĩnh viễn */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/10 p-6 shadow-sm">
          <h3 className="text-base font-bold text-rose-900 border-b border-rose-100 pb-3 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-rose-600">delete_forever</span>
            Xóa tài khoản vĩnh viễn
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-655 leading-relaxed">
              Yêu cầu xóa vĩnh viễn tài khoản của bạn khỏi hệ thống. Tài khoản của bạn sẽ bị ẩn ngay lập tức trên hệ thống. 
              Bạn sẽ có <span className="font-bold text-rose-700">7 ngày</span> làm thời gian chờ để khôi phục tài khoản nếu đổi ý. 
              Sau 7 ngày, toàn bộ thông tin tài khoản và dữ liệu cá nhân của bạn sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu và không thể khôi phục lại.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateConfirm && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => !actionLoading && setShowDeactivateConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">lock</span>
              Xác nhận vô hiệu hóa tài khoản
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Bạn có chắc chắn muốn vô hiệu hóa tài khoản của mình không?
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-slate-500 space-y-1.5">
              <li>Tài khoản của bạn sẽ bị tạm khóa ngay lập tức và các thành viên khác sẽ không thể tìm thấy hồ sơ của bạn.</li>
              <li>Bạn có thể khôi phục lại tài khoản bất kỳ lúc nào bằng cách đăng nhập lại và xác nhận mã OTP gửi về email.</li>
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={actionLoading}
                className="rounded-xl bg-amber-500 text-white px-4 py-2.5 text-xs font-bold hover:bg-amber-600 shadow-sm transition-colors"
              >
                {actionLoading ? 'Đang thực hiện...' : 'Xác nhận vô hiệu hóa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => !actionLoading && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600">delete_forever</span>
              Xác nhận xóa tài khoản
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-rose-900 font-bold">
              Cảnh báo: Hành động này sẽ lập lịch xóa tài khoản của bạn vĩnh viễn khỏi hệ thống!
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-slate-500 space-y-1.5">
              <li>Tài khoản của bạn sẽ được ẩn đi ngay lập tức trên hệ thống.</li>
              <li>Chúng tôi sẽ cung cấp cho bạn thời gian chờ khôi phục là <strong className="font-bold text-rose-600">7 ngày</strong>. Bạn chỉ cần đăng nhập lại và nhập OTP xác thực để hủy yêu cầu xóa.</li>
              <li>Sau <strong className="font-bold text-rose-600">7 ngày</strong>, tài khoản cùng toàn bộ thông tin cá nhân của bạn sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu và không thể khôi phục lại.</li>
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="rounded-xl bg-rose-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-rose-700 shadow-sm transition-colors"
              >
                {actionLoading ? 'Đang thực hiện...' : 'Xác nhận xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
