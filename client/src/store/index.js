import { configureStore } from '@reduxjs/toolkit';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';
import loginReducer from './slices/loginSlice';
import postReducer from './slices/postSlice'; 
import tagReducer from './slices/tagSlice';
import savedReducer from './slices/savedSlice';

const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    profile: profileReducer,
    auth: authReducer,
    login: loginReducer,
    posts: postReducer,
    tags: tagReducer,
    saved: savedReducer,
  },
});

export default store;
