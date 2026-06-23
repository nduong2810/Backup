import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginFormUI from './LoginFormUI';
import { clearLoginMessages, loginThunk, setLoginField } from '../../store/slices/loginSlice';
import { useToast } from '../../context/ToastContext';
import { 
  requestReactivateOtpApi, 
  verifyReactivateOtpApi, 
  requestCancelDeletionOtpApi, 
  verifyCancelDeletionOtpApi 
} from '../../services/authService';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, loading, errorMessage, successMessage } = useSelector((state) => state.login);
  const { toast } = useToast();

  // State quản lý khôi phục tài khoản bị vô hiệu hóa
  const [deactivatedEmail, setDeactivatedEmail] = useState('');
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateOtp, setDeactivateOtp] = useState('');
  const [showDeactivateOtpInput, setShowDeactivateOtpInput] = useState(false);

  // State quản lý hủy xóa tài khoản
  const [pendingDeleteInfo, setPendingDeleteInfo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [showDeleteOtpInput, setShowDeleteOtpInput] = useState(false);

  const [submittingOtp, setSubmittingOtp] = useState(false);

  useEffect(() => {
    dispatch(clearLoginMessages());
  }, [dispatch]);

  useEffect(() => {
    const lockedMsg = sessionStorage.getItem('locked_message');
    if (lockedMsg) {
      toast.error(lockedMsg, 5000);
      sessionStorage.removeItem('locked_message');
    }
  }, [toast]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearLoginMessages());
    }
  }, [successMessage, toast, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearLoginMessages());
    }
  }, [errorMessage, toast, dispatch]);

  const onSubmit = async () => {
    const resultAction = await dispatch(loginThunk());
    if (loginThunk.fulfilled.match(resultAction)) {
      navigate(resultAction.payload.redirectUrl || '/');
    } else if (loginThunk.rejected.match(resultAction)) {
      const payload = resultAction.payload;
      if (payload && payload.code === 'ACCOUNT_NOT_ACTIVATED') {
        navigate('/auth/register', { state: { email: payload.email, step: 2 } });
      } else if (payload && payload.code === 'ACCOUNT_DEACTIVATED') {
        setDeactivatedEmail(payload.email);
        setShowDeactivateConfirm(true);
        dispatch(clearLoginMessages());
      } else if (payload && payload.code === 'ACCOUNT_PENDING_DELETE') {
        setPendingDeleteInfo({
          email: payload.email,
          message: payload.message
        });
        setShowDeleteConfirm(true);
        dispatch(clearLoginMessages());
      }
    }
  };

  const handleRequestReactivateOtp = async () => {
    try {
      setSubmittingOtp(true);
      await requestReactivateOtpApi(deactivatedEmail);
      toast.success('Mã OTP kích hoạt lại đã được gửi vào email của bạn!');
      setShowDeactivateConfirm(false);
      setShowDeactivateOtpInput(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu gửi OTP');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleVerifyReactivateOtp = async () => {
    if (!deactivateOtp.trim()) {
      return toast.warning('Vui lòng nhập mã OTP');
    }
    try {
      setSubmittingOtp(true);
      await verifyReactivateOtpApi(deactivatedEmail, deactivateOtp.trim());
      toast.success('Kích hoạt lại tài khoản thành công! Đang tự động đăng nhập...');
      setShowDeactivateOtpInput(false);
      setDeactivateOtp('');
      
      // Tự động đăng nhập lại
      const resultAction = await dispatch(loginThunk());
      if (loginThunk.fulfilled.match(resultAction)) {
        navigate(resultAction.payload.redirectUrl || '/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleRequestCancelDeletionOtp = async () => {
    try {
      setSubmittingOtp(true);
      await requestCancelDeletionOtpApi(pendingDeleteInfo.email);
      toast.success('Mã OTP xác nhận hủy xóa đã được gửi vào email của bạn!');
      setShowDeleteConfirm(false);
      setShowDeleteOtpInput(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleVerifyCancelDeletionOtp = async () => {
    if (!deleteOtp.trim()) {
      return toast.warning('Vui lòng nhập mã OTP');
    }
    try {
      setSubmittingOtp(true);
      await verifyCancelDeletionOtpApi(pendingDeleteInfo.email, deleteOtp.trim());
      toast.success('Hủy yêu cầu xóa và khôi phục tài khoản thành công! Đang tự động đăng nhập...');
      setShowDeleteOtpInput(false);
      setDeleteOtp('');
      
      // Tự động đăng nhập
      const resultAction = await dispatch(loginThunk());
      if (loginThunk.fulfilled.match(resultAction)) {
        navigate(resultAction.payload.redirectUrl || '/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setSubmittingOtp(false);
    }
  };

  return (
    <>
      <LoginFormUI
        form={form}
        loading={loading}
        onFieldChange={(field, value) => dispatch(setLoginField({ field, value }))}
        onSubmit={onSubmit}
      />

      {/* Modal xác nhận kích hoạt lại tài khoản vô hiệu hóa */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">lock_open</span>
              Kích hoạt lại tài khoản
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Tài khoản của bạn hiện đang bị vô hiệu hóa. Bạn có muốn kích hoạt lại tài khoản này để tiếp tục sử dụng diễn đàn không?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleRequestReactivateOtp}
                disabled={submittingOtp}
                className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-xs font-bold hover:bg-orange-600 shadow-sm transition-colors"
              >
                {submittingOtp ? 'Đang gửi...' : 'Có, kích hoạt lại'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nhập OTP kích hoạt lại tài khoản */}
      {showDeactivateOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">verified_user</span>
              Nhập mã xác thực
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-5">
              Mã OTP kích hoạt lại tài khoản đã được gửi về email <span className="font-bold text-slate-800">{deactivatedEmail}</span>. Vui lòng kiểm tra và nhập mã bên dưới (hiệu lực trong 5 phút).
            </p>
            <div className="mt-4">
              <input
                type="text"
                maxLength={6}
                value={deactivateOtp}
                onChange={(e) => setDeactivateOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã OTP 6 số"
                className="w-full text-center tracking-[0.5em] font-mono text-xl rounded-xl border border-slate-350 bg-white px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateOtpInput(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleVerifyReactivateOtp}
                disabled={submittingOtp}
                className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-xs font-bold hover:bg-orange-600 shadow-sm transition-colors"
              >
                {submittingOtp ? 'Đang xác thực...' : 'Xác nhận kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hỏi tiếp tục xóa tài khoản hay khôi phục */}
      {showDeleteConfirm && pendingDeleteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600">warning</span>
              Khôi phục tài khoản chờ xóa
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {pendingDeleteInfo.message}
            </p>
            <p className="mt-3 text-sm font-bold text-slate-700 leading-5">
              Bạn có muốn hủy yêu cầu xóa và khôi phục tài khoản không?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleRequestCancelDeletionOtp}
                disabled={submittingOtp}
                className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-xs font-bold hover:bg-orange-600 shadow-sm transition-colors"
              >
                {submittingOtp ? 'Đang xử lý...' : 'Có, khôi phục tài khoản'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast.info('Tài khoản của bạn tiếp tục nằm trong trạng thái chờ xóa.');
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Không, tiếp tục chờ xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nhập OTP hủy yêu cầu xóa tài khoản */}
      {showDeleteOtpInput && pendingDeleteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">verified_user</span>
              Xác thực hủy xóa tài khoản
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-5">
              Mã OTP hủy yêu cầu xóa tài khoản đã được gửi về email <span className="font-bold text-slate-800">{pendingDeleteInfo.email}</span>. Vui lòng nhập mã OTP để khôi phục lại tài khoản.
            </p>
            <div className="mt-4">
              <input
                type="text"
                maxLength={6}
                value={deleteOtp}
                onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã OTP 6 số"
                className="w-full text-center tracking-[0.5em] font-mono text-xl rounded-xl border border-slate-350 bg-white px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteOtpInput(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleVerifyCancelDeletionOtp}
                disabled={submittingOtp}
                className="rounded-xl bg-rose-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-rose-700 shadow-sm transition-colors"
              >
                {submittingOtp ? 'Đang xác thực...' : 'Xác nhận hủy xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
