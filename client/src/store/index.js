import { configureStore } from '@reduxjs/toolkit';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';
import loginReducer from './slices/loginSlice';

const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    profile: profileReducer,
    auth: authReducer,
    login: loginReducer,
  },
});

export default store;
