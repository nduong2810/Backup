import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginFormUI from './LoginFormUI';
import { loginThunk, setLoginField } from '../../store/slices/loginSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { form, loading, errorMessage, successMessage } = useSelector((state) => state.login);

  const onSubmit = async () => {
    const resultAction = await dispatch(loginThunk());
    if (loginThunk.fulfilled.match(resultAction)) {
      navigate(resultAction.payload.redirectUrl || '/user/profile');
    }
  };

  return (
    <LoginFormUI
      form={form}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onFieldChange={(field, value) => dispatch(setLoginField({ field, value }))}
      onSubmit={onSubmit}
    />
  );
}
