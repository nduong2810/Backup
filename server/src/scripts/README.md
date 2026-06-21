# IT Forum - Database Seeding & Demo Data Guide

Thư mục này chứa các scripts dùng để khởi tạo cấu hình hệ thống và dữ liệu mẫu (demo) cho cơ sở dữ liệu MongoDB của ứng dụng.

## 1. Dữ liệu mẫu khởi tạo (Demo Data)

Script `resetAndSeedDemoData.js` sẽ tự động xóa sạch cơ sở dữ liệu hiện tại và nạp lại một bộ dữ liệu hoàn chỉnh, sẵn sàng cho việc kiểm thử và thuyết trình (demo) các chức năng.

### Danh sách tài khoản thử nghiệm

Tất cả tài khoản dưới đây đều sử dụng chung một mật khẩu (đã được mã hóa sẵn trong script):

*   **Mật khẩu đăng nhập:** `123456`

| Họ và tên | Email | Vai trò (Role) | Mô tả |
| :--- | :--- | :--- | :--- |
| **Admin Administrator** | `admin@itforum.local` | `admin` | Tài khoản quản trị toàn bộ hệ thống |
| **Nguyễn Văn An** | `user1@itforum.local` | `user` | Lập trình viên Web |
| **Trần Thị Bình** | `user2@itforum.local` | `user` | Chuyên viên Cơ sở dữ liệu |
| **Lê Hoàng Cường** | `user3@itforum.local` | `user` | Kỹ sư thuật toán & Python |
| **Phạm Minh Duy** | `user4@itforum.local` | `user` | Thành viên mới |
| **Hoàng Đức Em** | `user5@itforum.local` | `user` | Lập trình viên Java & Docker |

### Các thành phần dữ liệu được seed

1.  **Cấu hình hệ thống (System Settings):** Các tham số mặc định của hệ thống như giới hạn tích lũy uy tín ngày (Reputation Cap = 200), điểm thưởng Upvote (+10), điểm trừ Downvote (-2) và ngưỡng tự động ẩn bài viết khi bị báo cáo (5 cờ).
2.  **Thẻ phân loại (Tags):** 10 thẻ kỹ thuật phổ biến được chuẩn hóa slug không dấu (Ví dụ: `c++` -> `cpp`, `c#` -> `csharp`, `React` -> `react`, v.v.).
3.  **Bài viết (Posts):** **23 bài viết** đa dạng các chủ đề hỏi đáp (`question`) và chia sẻ (`advice`) trải dài từ 14 ngày trước cho đến hôm nay, thuộc các trạng thái khác nhau:
    *   `unresolved`: Bài viết đang hiển thị bình thường.
    *   `resolved`: Bài viết đã được giải quyết/khóa (không cho tương tác).
    *   `hidden`: Bài viết bị ẩn (do spam/quảng cáo).
    *   `deleted`: Bài viết bị xóa (nằm trong thùng rác, bao gồm xóa bởi admin hoặc chính chủ sở hữu).
4.  **Bình luận & Phản hồi (Comments & Replies):** Hỗ trợ cây bình luận phân cấp dạng lồng nhau (nested tree), bao gồm cả đánh dấu câu trả lời được chấp nhận cho bài viết đã giải quyết.
5.  **Cờ báo cáo vi phạm (Report Tickets):** Các cờ báo cáo có trạng thái khác nhau (`submitted`, `in_review`, `action_taken`, `closed`) để hiển thị đầy đủ thông tin trên trang quản lý cờ của admin.
6.  **Lịch sử danh tiếng (Reputation History):** Ghi chép biến động điểm uy tín tương ứng với các hoạt động tương tác upvote, downvote hoặc bị phạt báo cáo bài viết.

---

## 2. Hướng dẫn sử dụng & Setup

### Yêu cầu trước khi chạy
*   Đảm bảo dịch vụ **MongoDB** đang chạy trên máy cục bộ (mặc định cổng `27017`).
*   Nếu sử dụng MongoDB Atlas hoặc cổng khác, hãy cập nhật lại giá trị biến `MONGODB_URI` trong file `server/.env`.

### Câu lệnh thực thi

Di chuyển vào thư mục `server/` và chạy các lệnh tương ứng:

1.  **Reset toàn bộ DB và seed dữ liệu demo (khuyên dùng cho demo):**
    ```bash
    npm run seed:demo
    ```
    *Lệnh này tương đương với: `npx babel-node src/scripts/resetAndSeedDemoData.js`*

2.  **Chỉ seed cấu hình hệ thống ban đầu (không xóa dữ liệu người dùng):**
    ```bash
    npm run seed:sidebar
    ```
    *Lệnh này tương đương với: `npx babel-node src/scripts/seedSidebarData.js`*
