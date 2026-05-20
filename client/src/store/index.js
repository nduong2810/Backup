import { configureStore } from '@reduxjs/toolkit';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';
import loginReducer from './slices/loginSlice';
import questionReducer from './slices/questionSlice';
import postReducer from './slices/postSlice'; 
import tagReducer from './slices/tagSlice';

const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    profile: profileReducer,
    auth: authReducer,
    login: loginReducer,
    questions: questionReducer,
    posts: postReducer,
    tags: tagReducer,
  },
});

export default store;
