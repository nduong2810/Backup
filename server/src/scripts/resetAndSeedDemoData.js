import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../model/user.model.js';
import Tag from '../model/tag.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import ReportTicket from '../model/reportTicket.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';
import SystemSetting from '../model/systemSetting.model.js';
import { slugify } from '../util/slugify.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/it_student_forum';

// Shared password hash as requested by the user
const demoPassword = "$2b$10$mwaKuCxlJMyWTyvJ8dvNruvvJXvEfsXb81Myqfp1qhcrTihUdkOtS";

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Clear existing data
        console.log('Clearing old collections...');
        await Promise.all([
            User.deleteMany({}),
            Tag.deleteMany({}),
            Post.deleteMany({}),
            Comment.deleteMany({}),
            ReportTicket.deleteMany({}),
            ReputationHistory.deleteMany({}),
            SystemSetting.deleteMany({})
        ]);
        console.log('Collections cleared.');

        // 1. Seed System Settings
        console.log('Seeding system settings...');
        const defaultSettings = [
            {
                key: 'reputation_daily_cap',
                value: 200,
                description: 'Giới hạn số điểm danh tiếng (Reputation) tối đa thành viên nhận được từ upvote trong một ngày.'
            },
            {
                key: 'flag_auto_hide_threshold',
                value: 5,
                description: 'Số lượng cờ báo cáo vi phạm tối thiểu để bài đăng tự động chuyển sang trạng thái ẩn (hidden).'
            },
            {
                key: 'reputation_upvote_score',
                value: 10,
                description: 'Số điểm danh tiếng cộng cho tác giả khi nhận được 1 Upvote bài viết.'
            },
            {
                key: 'reputation_downvote_score',
                value: -2,
                description: 'Số điểm danh tiếng trừ đối với tác giả khi bị 1 Downvote bài viết.'
            }
        ];
        await SystemSetting.insertMany(defaultSettings);
        console.log('System settings seeded.');

        // 2. Seed Users (varied signup dates, reputation scores, active statuses)
        console.log('Seeding users...');
        const userDatas = [
            {
                fullName: 'Admin Administrator',
                email: 'admin@itforum.local',
                password: demoPassword,
                role: 'admin',
                isActive: true,
                phone: '0987654321',
                bio: 'Hệ thống Quản trị viên của IT Forum.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
                major: 'Công nghệ thông tin',
                reputation: 999,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            },
            {
                fullName: 'Nguyễn Văn An',
                email: 'user1@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0912345678',
                bio: 'Lập trình viên Web đam mê JavaScript và React.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user1',
                major: 'Kỹ thuật phần mềm',
                reputation: 150,
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
            },
            {
                fullName: 'Trần Thị Bình',
                email: 'user2@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0923456789',
                bio: 'Chuyên viên Cơ sở dữ liệu và Backend Node.js.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user2',
                major: 'Hệ thống thông tin',
                reputation: 80,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
            },
            {
                fullName: 'Lê Hoàng Cường',
                email: 'user3@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0934567890',
                bio: 'Thích nghiên cứu thuật toán và Machine Learning bằng Python.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user3',
                major: 'Khoa học máy tính',
                reputation: 210,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            },
            {
                fullName: 'Phạm Minh Duy',
                email: 'user4@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0945678901',
                bio: 'Người mới học lập trình, mong muốn giao lưu học hỏi.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user4',
                major: 'An toàn thông tin',
                reputation: 15,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            },
            {
                fullName: 'Hoàng Đức Em',
                email: 'user5@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0956789012',
                bio: 'Lập trình viên Java & Spring Boot, yêu thích Docker.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user5',
                major: 'Công nghệ phần mềm',
                reputation: 60,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            }
        ];
        const users = await User.insertMany(userDatas);
        console.log(`Seeded ${users.length} users.`);

        const adminUser = users[0];
        const user1 = users[1];
        const user2 = users[2];
        const user3 = users[3];
        const user4 = users[4];
        const user5 = users[5];

        // 3. Seed Tags (automatically slugified)
        console.log('Seeding tags...');
        const tagDatas = [
            { name: 'JavaScript', description: 'Các bài viết về ngôn ngữ JavaScript và hệ sinh thái liên quan.' },
            { name: 'React', description: 'Thư viện UI phía client phổ biến nhất cho Single Page Applications.' },
            { name: 'NodeJS', description: 'Môi trường runtime JavaScript phía server xây dựng trên Chrome V8 engine.' },
            { name: 'Python', description: 'Ngôn ngữ lập trình đa năng, đơn giản, dễ đọc và mạnh mẽ.' },
            { name: 'Java', description: 'Ngôn ngữ hướng đối tượng đa dụng phổ biến trong các dự án doanh nghiệp lớn.' },
            { name: 'C++', description: 'Ngôn ngữ lập trình hệ thống hiệu năng cao kế thừa từ C.' },
            { name: 'C#', description: 'Ngôn ngữ lập trình hướng đối tượng phát triển bởi Microsoft chạy trên .NET.' },
            { name: 'SQL', description: 'Ngôn ngữ truy vấn chuẩn hóa cho các cơ sở dữ liệu quan hệ.' },
            { name: 'MongoDB', description: 'Hệ quản trị cơ sở dữ liệu NoSQL hướng tài liệu linh hoạt.' },
            { name: 'Docker', description: 'Công cụ giúp tạo lập, đóng gói và triển khai ứng dụng bằng Container.' }
        ];

        const tags = await Tag.insertMany(
            tagDatas.map(t => ({
                ...t,
                slug: slugify(t.name)
            }))
        );
        console.log(`Seeded ${tags.length} tags.`);

        // 4. Seed Posts
        console.log('Seeding posts...');
        const postsData = [
            // Question 1: Active
            {
                title: 'Làm thế nào để tối ưu hiệu năng của component React?',
                content: 'Tôi đang phát triển một ứng dụng React lớn nhưng gặp vấn đề về render lại component liên tục làm giảm hiệu năng. Mọi người có thể gợi ý các cách tối ưu như React.memo, useMemo, useCallback hay ảo hóa danh sách không?',
                author: user1._id,
                postType: 'question',
                tags: ['react', 'javascript'],
                status: 'unresolved',
                viewCount: 154,
                upvotes: [user2._id, user3._id, user5._id],
                downvotes: [],
                likes: [user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            },
            // Advice 1: Active
            {
                title: 'Tổng hợp lộ trình tự học Python cho người mới bắt đầu',
                content: 'Python là ngôn ngữ rất thân thiện cho người mới bắt đầu. Dưới đây là lộ trình từ căn bản (Biến, Kiểu dữ liệu, Cấu trúc rẽ nhánh) đến nâng cao (OOP, File, RegEx) và làm quen với các thư viện phổ biến như Pandas, NumPy cho khoa học dữ liệu.',
                author: user3._id,
                postType: 'advice',
                tags: ['python'],
                status: 'unresolved',
                viewCount: 420,
                upvotes: [user1._id, user2._id, user4._id, user5._id],
                downvotes: [],
                likes: [user1._id, user2._id, user4._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            // Question 2: Resolved (locked)
            {
                title: 'Tại sao kết nối MongoDB Atlas bị timeout lỗi MongooseServerSelectionError?',
                content: 'Tôi cố gắng kết nối ứng dụng Node.js của mình lên MongoDB Atlas nhưng liên tục nhận lỗi timeout. Tôi đã điền đúng URL kết nối. Có ai biết nguyên nhân và cách khắc phục lỗi này không?',
                author: user2._id,
                postType: 'question',
                tags: ['mongodb', 'nodejs'],
                status: 'resolved',
                viewCount: 88,
                upvotes: [user1._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            // Question 3: Hidden (Bị ẩn)
            {
                title: 'Quảng cáo mua bán phần mềm giá rẻ tại Hà Nội',
                content: 'Chúng tôi chuyên cung cấp bản quyền phần mềm Office, Windows giá siêu rẻ chỉ từ 50k. Vui lòng liên hệ số điện thoại 0900000000 để biết thêm chi tiết. Ship COD toàn quốc nhanh chóng.',
                author: user4._id,
                postType: 'question',
                tags: ['javascript'],
                status: 'hidden',
                viewCount: 22,
                upvotes: [],
                downvotes: [user1._id, user2._id, user3._id],
                likes: [],
                dislikes: [user1._id, user2._id],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            // Advice 2: Deleted (Xóa bởi Admin)
            {
                title: 'Hướng dẫn sử dụng các lệnh Docker cơ bản cho người bắt đầu',
                content: 'Docker giúp đóng gói và chạy ứng dụng bất kỳ một cách dễ dàng. Các lệnh phổ biến bao gồm docker run, docker build, docker ps, docker images, docker exec. Cùng tìm hiểu cách sử dụng chúng hiệu quả nhất.',
                author: user5._id,
                postType: 'advice',
                tags: ['docker'],
                status: 'deleted',
                deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                deletedBy: 'admin',
                viewCount: 95,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            // Question 4: Deleted (Xóa bởi Owner - Trash)
            {
                title: 'Hỏi về việc cài đặt môi trường C++ trên Windows 11',
                content: 'Tôi muốn cài đặt trình biên dịch MinGW để chạy code C++ trên Windows nhưng cấu hình biến môi trường PATH mãi không được. Có ai hướng dẫn cụ thể từng bước được không?',
                author: user1._id,
                postType: 'question',
                tags: ['cpp'],
                status: 'deleted',
                deletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                deletedBy: 'owner',
                viewCount: 15,
                upvotes: [],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            // Question 5: Active
            {
                title: 'Tìm hiểu về điểm khác biệt giữa C# và Java',
                content: 'Tôi thấy C# và Java có cấu trúc cú pháp rất giống nhau, tuy nhiên đều có những hướng đi riêng biệt. Mọi người có thể liệt kê điểm khác biệt chính về bộ nhớ, các tính năng ngôn ngữ và hệ sinh thái được không?',
                author: user5._id,
                postType: 'question',
                tags: ['csharp', 'java'],
                status: 'unresolved',
                viewCount: 120,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            // Advice 3: Active
            {
                title: 'Cách thiết kế cơ sở dữ liệu quan hệ chuẩn hóa 3NF',
                content: 'Thiết kế cơ sở dữ liệu chuẩn hóa giúp giảm thiểu dư thừa dữ liệu. Dưới đây là cách đưa một bảng từ dạng thô về 1NF (Kiểu dữ liệu nguyên tố), 2NF (Loại bỏ phụ thuộc hàm bộ phận) và 3NF (Loại bỏ phụ thuộc hàm bắc cầu).',
                author: user2._id,
                postType: 'advice',
                tags: ['sql'],
                status: 'unresolved',
                viewCount: 310,
                upvotes: [user1._id, user3._id, user5._id],
                downvotes: [],
                likes: [user1._id, user3._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            // Question 6: Active
            {
                title: 'Làm thế nào để Git clone chỉ lấy 1 commit gần nhất (Shallow clone)?',
                content: 'Dự án tôi đang tải về rất lớn và có lịch sử commit lâu đời. Tôi chỉ cần code hiện tại để deploy, làm sao để clone nhanh nhất mà không phải tải toàn bộ lịch sử commit về máy?',
                author: user3._id,
                postType: 'question',
                tags: ['git'],
                status: 'unresolved',
                viewCount: 75,
                upvotes: [user1._id, user2._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            // 10. ES2024 features
            {
                title: 'Các tính năng mới đáng chú ý trong ES2024 (ECMAScript 2024)',
                content: 'ECMAScript 2024 giới thiệu nhiều tính năng thú vị như Object.groupBy, Map.groupBy, Promise.withResolvers, và các cải tiến về Regex. Hãy cùng xem các ví dụ thực tế cách dùng chúng để viết code ngắn gọn hơn.',
                author: user1._id,
                postType: 'advice',
                tags: ['javascript'],
                status: 'unresolved',
                viewCount: 180,
                upvotes: [user2._id, user3._id],
                downvotes: [],
                likes: [user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            // 11. Docker CMD vs ENTRYPOINT
            {
                title: 'Sự khác nhau giữa Docker RUN, CMD và ENTRYPOINT?',
                content: 'Tôi thường xuyên nhầm lẫn giữa 3 chỉ thị này trong Dockerfile. RUN chạy khi build image, trong khi CMD và ENTRYPOINT chạy khi container khởi động. Bài viết này sẽ phân tích chi tiết khi nào nên dùng CMD và khi nào dùng ENTRYPOINT.',
                author: user5._id,
                postType: 'question',
                tags: ['docker'],
                status: 'unresolved',
                viewCount: 290,
                upvotes: [user1._id, user2._id, user3._id],
                downvotes: [],
                likes: [user1._id, user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            // 12. SQL optimization
            {
                title: 'Làm thế nào để tối ưu truy vấn SQL SELECT với JOIN lớn?',
                content: 'Tôi đang thực hiện truy vấn trên 3 bảng lớn với tổng số dòng hơn 10 triệu. Hệ thống phản hồi rất chậm. Làm sao để tối ưu hóa truy vấn này? Nên tạo index như thế nào trên các khóa ngoại?',
                author: user2._id,
                postType: 'question',
                tags: ['sql'],
                status: 'unresolved',
                viewCount: 204,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            // 13. MongoDB schema design
            {
                title: 'Các mô hình thiết kế Schema trong NoSQL MongoDB: Embedding vs Referencing',
                content: 'Khi nào nên lưu tài liệu con bên trong (Embedding) và khi nào nên tham chiếu bằng ID (Referencing)? Quyết định này ảnh hưởng trực tiếp đến hiệu năng đọc/ghi. Dưới đây là các ví dụ cụ thể.',
                author: user3._id,
                postType: 'advice',
                tags: ['mongodb'],
                status: 'unresolved',
                viewCount: 340,
                upvotes: [user1._id, user2._id, user5._id],
                downvotes: [],
                likes: [user1._id, user2._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            // 14. C++ memory leak & smart pointers
            {
                title: 'Lỗi giải phóng bộ nhớ (Memory Leak) trong C++ và cách dùng Smart Pointers',
                content: 'Trong C++ hiện đại, chúng ta không nên dùng con trỏ thô và lệnh delete thủ công nữa. Thay vào đó, hãy sử dụng std::unique_ptr, std::shared_ptr và std::weak_ptr từ thư viện memory để tự động hóa việc quản lý vòng đời đối tượng.',
                author: user1._id,
                postType: 'question',
                tags: ['cpp'],
                status: 'unresolved',
                viewCount: 112,
                upvotes: [user3._id, user5._id],
                downvotes: [],
                likes: [user3._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            // 15. React Context + useReducer
            {
                title: 'Hướng dẫn sử dụng React Context kết hợp useReducer hiệu quả',
                content: 'React Context kết hợp useReducer là giải pháp quản lý trạng thái toàn cục rất tốt cho các ứng dụng vừa và nhỏ mà không cần cài đặt Redux. Bài viết hướng dẫn chi tiết cách tạo State Provider và dispatch actions.',
                author: user2._id,
                postType: 'advice',
                tags: ['react', 'javascript'],
                status: 'unresolved',
                viewCount: 228,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            // 16. Git resolve conflict
            {
                title: 'Cách giải quyết Merge Conflict trong Git khi làm việc nhóm?',
                content: 'Khi nhiều người cùng sửa đổi trên cùng một dòng của một file, Git sẽ báo lỗi conflict khi merge. Làm thế nào để giải quyết thủ công bằng VS Code hoặc Git CLI một cách an toàn nhất?',
                author: user4._id,
                postType: 'question',
                tags: ['git'],
                status: 'unresolved',
                viewCount: 94,
                upvotes: [user1._id, user2._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            // 17. NodeJS Express vs Fastify
            {
                title: 'So sánh hiệu năng thực tế giữa ExpressJS và Fastify',
                content: 'ExpressJS đã quá quen thuộc, nhưng Fastify tự hào là framework có tốc độ xử lý nhanh gấp nhiều lần nhờ tối ưu hóa JSON schema và giảm overhead. Chúng ta hãy so sánh qua bài benchmark thực tế.',
                author: user5._id,
                postType: 'question',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 172,
                upvotes: [user1._id, user2._id, user3._id],
                downvotes: [],
                likes: [user1._id, user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            // 18. Java thread-safe Singleton
            {
                title: 'Cách triển khai Design Pattern Singleton trong Java an toàn đa luồng (Thread-safe)',
                content: 'Singleton đảm bảo một class chỉ có duy nhất một instance. Tuy nhiên trong môi trường đa luồng, làm sao để khởi tạo instance đó an toàn? Hãy cùng xem cách dùng Double-Checked Locking và Bill Pugh Singleton.',
                author: user3._id,
                postType: 'advice',
                tags: ['java'],
                status: 'unresolved',
                viewCount: 160,
                upvotes: [user1._id, user5._id],
                downvotes: [],
                likes: [user1._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            // 19. Python Scrapy vs BeautifulSoup
            {
                title: 'Nên sử dụng thư viện Scrapy hay BeautifulSoup để cào dữ liệu web?',
                content: 'Tôi muốn viết một script cào dữ liệu sản phẩm từ một trang thương mại điện tử lớn. Thư viện BeautifulSoup có vẻ dễ viết hơn nhưng Scrapy lại mạnh mẽ và hỗ trợ bất đồng bộ. Mọi người khuyên dùng loại nào?',
                author: user4._id,
                postType: 'question',
                tags: ['python'],
                status: 'unresolved',
                viewCount: 82,
                upvotes: [user3._id],
                downvotes: [],
                likes: [user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            // 20. ASP.NET Core Web API
            {
                title: 'Bắt đầu với ASP.NET Core Web API: Các bước thiết lập ban đầu',
                content: 'ASP.NET Core là framework mạnh mẽ cho backend API. Bài viết hướng dẫn cấu hình Dependency Injection, Entity Framework Core kết nối với SQL Server và thiết lập các Route cơ bản cho Controller.',
                author: user1._id,
                postType: 'advice',
                tags: ['csharp', 'sql'],
                status: 'unresolved',
                viewCount: 135,
                upvotes: [user2._id, user5._id],
                downvotes: [],
                likes: [user2._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            // 21. JavaScript closure
            {
                title: 'Closure trong JavaScript là gì và ví dụ thực tế?',
                content: 'Closure là một hàm nhớ được môi trường bên ngoài nơi nó được tạo ra, ngay cả khi môi trường đó đã thực thi xong. Đây là khái niệm quan trọng nhưng dễ gây nhầm lẫn. Cùng tìm hiểu qua ví dụ hàm đếm counter.',
                author: user2._id,
                postType: 'question',
                tags: ['javascript'],
                status: 'unresolved',
                viewCount: 92,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            },
            // 22. Another spam post (hidden)
            {
                title: 'Nhận viết thuê luận văn, đồ án tốt nghiệp công nghệ thông tin giá rẻ',
                content: 'Dịch vụ làm hộ đồ án tốt nghiệp React, Node.js, PHP giá sinh viên. Cam kết qua môn 100%, bảo mật thông tin khách hàng tuyệt đối. Inbox Zalo hoặc Telegram để được tư vấn báo giá trực tiếp.',
                author: user4._id,
                postType: 'question',
                tags: ['react', 'nodejs'],
                status: 'hidden',
                viewCount: 30,
                upvotes: [],
                downvotes: [user1._id, user2._id, user3._id, user5._id],
                likes: [],
                dislikes: [user1._id, user2._id],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            // 23. Another deleted post (admin)
            {
                title: 'Chia sẻ khóa học lập trình React Native Full Stack lậu miễn phí',
                content: 'Tổng hợp link tải Google Drive toàn bộ các video khóa học React Native chất lượng cao trị giá 5 triệu đồng. Link tải ở đây: http://sharedcourse-leak.xyz',
                author: user5._id,
                postType: 'advice',
                tags: ['react'],
                status: 'deleted',
                deletedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                deletedBy: 'admin',
                viewCount: 77,
                upvotes: [],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];
        const posts = await Post.insertMany(postsData);
        console.log(`Seeded ${posts.length} posts.`);

        const postReactMemo = posts[0];
        const postPython = posts[1];
        const postMongoTimeout = posts[2];
        const postSpam = posts[3];
        const postSql = posts[7];
        const postGit = posts[8];

        // 5. Seed Comments & Nested Replies
        console.log('Seeding comments...');
        const commentsData = [
            // Comments for React post
            {
                content: 'Bạn nên sử dụng React.memo để bao bọc component con, tránh render lại khi props không đổi. Kết hợp useCallback cho các hàm callback truyền xuống component con đó.',
                author: user2._id,
                post: postReactMemo._id,
                parentComment: null,
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                content: 'Đúng vậy! Tuy nhiên lưu ý không lạm dụng React.memo vì bản thân việc so sánh props nông (shallow comparison) cũng tốn chi phí CPU.',
                author: user3._id,
                post: postReactMemo._id,
                parentComment: null,
                likes: [user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            // Comments for MongoDB Timeout post (Resolved)
            {
                content: 'Bạn đã mở Whitelist IP trong MongoDB Atlas chưa? Thường mặc định Atlas chặn tất cả các IP lạ truy cập vào cụm CSDL.',
                author: user1._id,
                post: postMongoTimeout._id,
                parentComment: null,
                likes: [user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                content: 'A, đúng rồi! Tôi vừa thêm cấu hình IP 0.0.0.0/0 (cho phép tất cả IP) trên MongoDB Atlas và đã kết nối thành công. Cảm ơn bạn rất nhiều!',
                author: user2._id,
                post: postMongoTimeout._id,
                parentComment: null,
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            // Comments for SQL post
            {
                content: 'Bài viết chia sẻ rất chi tiết, dễ hiểu. Cảm ơn tác giả nhiều nhé!',
                author: user4._id,
                post: postSql._id,
                parentComment: null,
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];

        const comments = await Comment.insertMany(commentsData);
        console.log(`Seeded ${comments.length} comments.`);

        const comment1 = comments[0];
        const comment2 = comments[1];
        const commentMongoAnswer = comments[2];
        const commentMongoReply = comments[3];

        // Link child replies
        await Comment.updateOne({ _id: comment2._id }, { $set: { parentComment: comment1._id } });
        await Comment.updateOne({ _id: commentMongoReply._id }, { $set: { parentComment: commentMongoAnswer._id } });
        console.log('Linked nested comment replies.');

        // 6. Seed Report Tickets (Flags)
        console.log('Seeding report tickets (flags)...');
        const reportTicketsData = [
            // Spam post report tickets (4 reports -> hides automatically)
            {
                post: postSpam._id,
                reporter: user1._id,
                flagType: 'spam',
                details: 'Đây hoàn toàn là nội dung rác quảng cáo, vi phạm nghiêm trọng quy định cộng đồng.',
                status: 'action_taken',
                outcome: 'helpful',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ: spam.', actorRole: 'user', actor: user1._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
                    { status: 'action_taken', note: 'Tự động ẩn bài viết vì quá số cờ tối thiểu.', actorRole: 'system', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                post: postSpam._id,
                reporter: user2._id,
                flagType: 'spam',
                details: 'Spam bán hàng online, vui lòng xóa bỏ bài này.',
                status: 'action_taken',
                outcome: 'helpful',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ: spam.', actorRole: 'user', actor: user2._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                post: postSpam._id,
                reporter: user3._id,
                flagType: 'spam',
                details: 'Báo cáo quảng cáo rác.',
                status: 'action_taken',
                outcome: 'helpful',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ: spam.', actorRole: 'user', actor: user3._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            // Pending report ticket for review on Git post
            {
                post: postGit._id,
                reporter: user4._id,
                flagType: 'duplicate',
                details: 'Câu hỏi này đã có người hỏi trước đây rồi, trùng lặp nội dung.',
                status: 'submitted',
                outcome: 'pending',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ báo cáo trùng lặp.', actorRole: 'user', actor: user4._id, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            },
            // Resolved ticket (declined) on Python roadmap
            {
                post: postPython._id,
                reporter: user4._id,
                flagType: 'very_low_quality',
                details: 'Không có thông tin hữu ích lắm, viết sơ sài.',
                status: 'closed',
                outcome: 'declined',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ: very_low_quality.', actorRole: 'user', actor: user4._id, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
                    { status: 'in_review', note: 'Admin đang xem xét cờ báo cáo này.', actorRole: 'admin', actor: adminUser._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
                    { status: 'closed', note: 'Cờ bị từ chối: Bài viết chất lượng tốt và chi tiết.', actorRole: 'admin', actor: adminUser._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            }
        ];
        const tickets = await ReportTicket.insertMany(reportTicketsData);
        console.log(`Seeded ${tickets.length} report tickets.`);

        // 7. Seed Reputation History
        console.log('Seeding reputation history...');
        const reputationHistoriesData = [
            // User 1 gets upvotes on React Performance post (+30)
            {
                user: user1._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postReactMemo._id,
                voter: user2._id,
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                user: user1._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postReactMemo._id,
                voter: user3._id,
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                user: user1._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postReactMemo._id,
                voter: user5._id,
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            // User 3 gets upvotes on Python roadmap (+40)
            {
                user: user3._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postPython._id,
                voter: user1._id,
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                user: user3._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postPython._id,
                voter: user2._id,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            // User 4 spam penalty (-10)
            {
                user: user4._id,
                type: 'post_deleted_by_report',
                title: 'Bài viết đã ẩn/xóa (Bị báo cáo)',
                reputationEarned: -10,
                targetId: postSpam._id,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];
        await ReputationHistory.insertMany(reputationHistoriesData);
        console.log('Reputation histories seeded.');

        console.log('🌱 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

seed();
