import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAllQuestions } from '../../services/questionService';

// 1. Trạng thái ban đầu
const initialState = {
    questionsList: [], // Chứa mảng các câu hỏi
    loading: false,
    error: null,
};

// Hàm hỗ trợ trích xuất lỗi (tương tự các slice khác nhóm bạn đang làm)
const extractError = (error) => {
    return error?.response?.data?.message || 'Không thể tải danh sách câu hỏi. Vui lòng thử lại sau.';
};

// 2. Thunk: Gọi API bất đồng bộ
export const fetchQuestionsThunk = createAsyncThunk(
    'questions/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAllQuestions();
            // Trả về phần mảng dữ liệu (giả sử cấu trúc API là: { success: true, data: [...] })
            return response.data.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// 3. Khởi tạo Slice và xử lý Reducers
const questionSlice = createSlice({
    name: 'questions',
    initialState,
    reducers: {
        // Nếu bạn cần reducer đồng bộ nào thì thêm vào đây
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuestionsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuestionsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.questionsList = action.payload; // Gán dữ liệu trả về từ API vào State
            })
            .addCase(fetchQuestionsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default questionSlice.reducer;