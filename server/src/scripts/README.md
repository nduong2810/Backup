# IT Forum - Database Seeding & Demo Data Guide

Thư mục này chứa các scripts dùng để khởi tạo cấu hình hệ thống và dữ liệu mẫu (demo) cho cơ sở dữ liệu MongoDB của ứng dụng.

## 1. Dữ liệu mẫu khởi tạo (Demo Data)

Script `resetAndSeedDemoData.js` sẽ tự động xóa sạch cơ sở dữ liệu hiện tại và nạp lại một bộ dữ liệu hoàn chỉnh, sẵn sàng cho việc kiểm thử và thuyết trình (demo) các chức năng.

### Danh sách tài khoản thử nghiệm

Tất cả tài khoản dưới đây đều sử dụng chung một mật khẩu (đã được mã hóa sẵn trong script):

*   **Mật khẩu đăng nhập:** `123456`

| Họ và tên | Email | Vai trò (Role) | Chuyên ngành (Major) | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Administrator** | `admin@itforum.local` | `admin` | Công nghệ thông tin | Tài khoản quản trị chính của hệ thống |
| **Nguyễn Minh Tâm** | `admin2@itforum.local` | `admin` | Kỹ thuật phần mềm | Phó ban kiểm duyệt hệ thống |
| **Nguyễn Văn An** | `user1@itforum.local` | `user` | Kỹ thuật phần mềm | Lập trình viên Web (React/Node) |
| **Trần Thị Bình** | `user2@itforum.local` | `user` | Hệ thống thông tin | Chuyên viên Cơ sở dữ liệu |
| **Lê Hoàng Cường** | `user3@itforum.local` | `user` | Khoa học máy tính | Kỹ sư thuật toán & AI |
| **Phạm Minh Duy** | `user4@itforum.local` | `user` | An toàn thông tin | Thành viên mới học Frontend |
| **Hoàng Đức Em** | `user5@itforum.local` | `user` | Công nghệ phần mềm | Lập trình viên Java & C# |
| **Vũ Thị Hương** | `user6@itforum.local` | `user` | An toàn thông tin | Chuyên gia kiểm thử bảo mật |
| **Phạm Văn Giang** | `user7@itforum.local` | `user` | Khoa học máy tính | Nghiên cứu sinh Machine Learning |
| **Đỗ Minh Hải** | `user8@itforum.local` | `user` | Mạng máy tính | Cloud Engineer & DevOps |
| **Bùi Thị Kim** | `user9@itforum.local` | `user` | Kỹ thuật phần mềm | Lập trình viên di động (React Native) |
| **Ngô Văn Lâm** | `user10@itforum.local` | `user` | Công nghệ thông tin | Nhà phát triển game độc lập |
| **Dương Quốc Nam** | `user11@itforum.local` | `user` | Kỹ thuật máy tính | Lập trình viên phần cứng & IoT |
| **Phùng Thị Oanh** | `user12@itforum.local` | `user` | Hệ thống thông tin | Thiết kế UI/UX |
| **Lý Hoàng Phong** | `user13@itforum.local` | `user` | Kỹ thuật phần mềm | Fullstack Developer |

### Các thành phần dữ liệu được seed

1.  **Cấu hình hệ thống (System Settings):** Cấu hình mặc định như Reputation Cap (200), Upvote Score (+10), Downvote Score (-2) và tự động ẩn bài viết khi bị báo cáo (5 cờ).
2.  **Thẻ phân loại (Tags):** 18 thẻ kỹ thuật phổ biến được chuẩn hóa slug không dấu (`javascript`, `react`, `nodejs`, `python`, `typescript`, `nextjs`, `docker`, `cybersecurity`, `machinelearning`, v.v.).
3.  **Bài viết (Posts):** **25 bài viết** chất lượng cao với nội dung rất chi tiết, định dạng Markdown phong phú (bao gồm tiêu đề con, danh sách, khối code mẫu như YAML, Javascript, SQL, Python, v.v.) kèm các hình ảnh công nghệ từ Unsplash phù hợp ngữ cảnh bài đăng.
4.  **Bình luận & Phản hồi (Comments & Replies):** Hỗ trợ cây bình luận phân cấp sâu (lên đến 3-4 cấp lồng nhau) để demo giao diện thảo luận, bao gồm cả thiết lập Accepted Answer (Câu trả lời tốt nhất) cho bài viết đã giải quyết.
5.  **Cờ báo cáo vi phạm (Report Tickets):** Các báo cáo có lịch sử xử lý (history logs) phục vụ việc chạy demo luồng phê duyệt/kiểm duyệt của Admin.
6.  **Lịch sử danh tiếng (Reputation History):** Hơn 40 bản ghi lịch sử biến động điểm uy tín để hiển thị biểu đồ danh tiếng đẹp mắt trên trang cá nhân.
7.  **Ủng hộ bài viết (Donation Transactions):** Các giao dịch quyên góp tiền ủng hộ tác giả bài viết qua VNPay/COD với nhiều trạng thái khác nhau (`completed`, `pending_review`, `rejected`).

---

## 2. Hướng dẫn sử dụng & Setup

### Yêu cầu trước khi chạy
*   Đảm bảo dịch vụ **MongoDB** đang chạy trên máy cục bộ (mặc định cổng `27017`).
*   Nếu sử dụng MongoDB Atlas hoặc cổng khác, hãy cập nhật lại giá trị biến `MONGODB_URI` trong file `server/.env`.

### Câu lệnh thực thi

Di chuyển vào thư mục `server/` và chạy:

```bash
npm run seed:demo
```
*Lệnh này tương đương với: `npx babel-node src/scripts/resetAndSeedDemoData.js`*
