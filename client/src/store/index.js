import { configureStore } from '@reduxjs/toolkit';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    profile: profileReducer,
    auth: authReducer,
  },
});

export default store;
