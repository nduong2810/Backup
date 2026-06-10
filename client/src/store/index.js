import { configureStore } from '@reduxjs/toolkit';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';
import loginReducer from './slices/loginSlice';
import postReducer from './slices/postSlice'; 
import tagReducer from './slices/tagSlice';
import reportReducer from './slices/reportSlice';
import savedReducer from './slices/savedSlice';
import notificationReducer from './slices/notificationSlice';
import statisticsReducer from './slices/statisticsSlice';

const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    profile: profileReducer,
    auth: authReducer,
    login: loginReducer,
    posts: postReducer,
    tags: tagReducer,
    reports: reportReducer,
    saved: savedReducer,
    notifications: notificationReducer,
    statistics: statisticsReducer,
  },
});

export default store;