import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginFormUI from './LoginFormUI';
import { clearLoginMessages, loginThunk, setLoginField } from '../../store/slices/loginSlice';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, loading, errorMessage, successMessage } = useSelector((state) => state.login);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(clearLoginMessages());
  }, [dispatch]);

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
      }
    }
  };

  return (
    <LoginFormUI
      form={form}
      loading={loading}
      onFieldChange={(field, value) => dispatch(setLoginField({ field, value }))}
      onSubmit={onSubmit}
    />
  );
}
