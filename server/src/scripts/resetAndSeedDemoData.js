import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../model/user.model.js';
import Tag from '../model/tag.model.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import ReportTicket from '../model/reportTicket.model.js';
import ReputationHistory from '../model/reputationHistory.model.js';
import SystemSetting from '../model/systemSetting.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import { slugify } from '../util/slugify.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/it_student_forum';

// Shared password hash (123456 hoặc password tùy thuộc vào hash ban đầu)
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
            SystemSetting.deleteMany({}),
            DonationTransaction.deleteMany({})
        ]);
        try {
            await ReportTicket.collection.dropIndex('post_1_reporter_1_flagType_1');
            console.log('Dropped old ReportTicket compound unique index.');
        } catch (e) {
            console.log('Old ReportTicket index not found or already dropped.');
        }
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

        // 2. Seed Users
        console.log('Seeding users...');
        const userDatas = [
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d0'),
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
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d1'),
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
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d2'),
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
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d3'),
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
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d4'),
                fullName: 'Trần Quốc Bảo',
                email: 'user4@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                phone: '0945678901',
                bio: 'Người mới học lập trình, thích tìm tòi React và học hỏi kinh nghiệm.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user4',
                major: 'An toàn thông tin',
                reputation: 96,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d5'),
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
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
        ];
        const users = await User.insertMany(userDatas);
        console.log(`Seeded ${users.length} users.`);

        const adminUser = users[0];
        const user1 = users[1];
        const user2 = users[2];
        const user3 = users[3];
        const user4 = users[4]; // Trần Quốc Bảo
        const user5 = users[5];

        // 3. Seed Tags
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
            { name: 'Docker', description: 'Công cụ giúp tạo lập, đóng gói và triển khai ứng dụng bằng Container.' },
            { name: 'Git', description: 'Hệ thống quản lý phiên bản phân tán phổ biến nhất.' }
        ];

        const tags = await Tag.insertMany(
            tagDatas.map(t => ({
                ...t,
                slug: slugify(t.name)
            }))
        );
        console.log(`Seeded ${tags.length} tags.`);

        // 4. Seed Posts (using the exact IDs from the user's DB, matching unresolved/resolved statuses)
        console.log('Seeding posts...');
        const postsData = [
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e8'),
                title: 'React useEffect bị gọi 2 lần khi chạy dev là lỗi hay bình thường?',
                content: 'Mình đang dùng React StrictMode và thấy useEffect gọi hai lần trong môi trường dev. Điều này có ảnh hưởng production không, và nên xử lý API call như thế nào cho sạch?',
                author: user4._id, // Trần Quốc Bảo
                postType: 'question',
                tags: ['react', 'javascript'],
                status: 'unresolved',
                viewCount: 57,
                dailyViewCount: 4,
                dailyViewDate: new Date(),
                upvotes: [user1._id],
                downvotes: [user5._id],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e9'),
                title: 'Thiết kế schema MongoDB cho bài viết có tag và bình luận lồng nhau',
                content: 'Mình cần thiết kế một schema cho một forum IT có bài viết, các tags và hệ thống bình luận lồng nhau nhiều cấp (nested comments). Nên nhúng (embed) hay tham chiếu (reference) bình luận? Mong mọi người tư vấn.',
                author: user1._id,
                postType: 'question',
                tags: ['mongodb', 'nodejs'],
                status: 'unresolved',
                viewCount: 142,
                upvotes: [user2._id, user3._id],
                downvotes: [],
                likes: [user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ea'),
                title: 'Kinh nghiệm tự học NodeJS backend trong 4 tuần',
                content: 'Chia sẻ lộ trình mình tự học NodeJS hiệu quả từ Zero. Bắt đầu từ hiểu Event Loop, Modules, sau đó viết API cơ bản với Express, kết nối cơ sở dữ liệu MongoDB và cuối cùng triển khai lên VPS.',
                author: user3._id,
                postType: 'advice',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 532,
                upvotes: [user1._id, user2._id, user4._id, user5._id],
                downvotes: [],
                likes: [user1._id, user2._id, user4._id, user5._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7eb'),
                title: 'JWT nên lưu ở localStorage hay cookie httpOnly?',
                content: 'Vấn đề bảo mật thông tin đăng nhập: Lưu JWT token ở localStorage dễ bị tấn công XSS, còn lưu ở Cookie httpOnly + Secure thì bị ảnh hưởng bởi CSRF. Giải pháp nào là tối ưu nhất cho SPA?',
                author: user2._id,
                postType: 'question',
                tags: ['javascript', 'nodejs'],
                status: 'unresolved',
                viewCount: 310,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ec'),
                title: 'Checklist trước khi nộp đồ án môn Công nghệ phần mềm',
                content: 'Dưới đây là một số mục cần tự rà soát trước khi đóng gói đồ án để thuyết trình trước hội đồng: cấu hình ENV, validate dữ liệu đầy đủ, phân quyền middleware và đặc biệt là chuẩn bị dữ liệu mẫu hợp lý.',
                author: user5._id,
                postType: 'advice',
                tags: ['javascript', 'react'],
                status: 'unresolved',
                viewCount: 88,
                upvotes: [user1._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ed'),
                title: 'Vite build báo chunk lớn hơn 500kB thì có cần xử lý ngay không?',
                content: 'Khi chạy build dự án React bằng Vite, terminal cảnh báo một số chunk có dung lượng vượt quá 500kB. Việc này có gây ảnh hưởng đáng kể đến tốc độ load trang đầu không và xử lý bằng manualChunks như thế nào?',
                author: user1._id,
                postType: 'question',
                tags: ['react'],
                status: 'unresolved',
                viewCount: 95,
                upvotes: [user2._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ee'),
                title: 'Cách phân trang danh sách bài viết theo tag cho mượt?',
                content: 'Tôi muốn viết API phân trang bài viết kèm theo lọc tag. Cách sử dụng skip và limit trong MongoDB có bị chậm khi dữ liệu lớn không? Có giải pháp phân trang theo Cursor nào tối ưu hơn không?',
                author: user2._id,
                postType: 'question',
                tags: ['mongodb', 'sql'],
                status: 'unresolved',
                viewCount: 110,
                upvotes: [user3._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ef'),
                title: 'Một số lỗi UI thường gặp khi làm dashboard admin',
                content: 'Tổng hợp các vấn đề hiển thị thường thấy ở trang quản trị: bảng biểu quá rộng gây tràn trang, sidebar thiếu responsive trên mobile, thời gian loading lâu và không có placeholder skeleton.',
                author: user5._id,
                postType: 'advice',
                tags: ['react'],
                status: 'unresolved',
                viewCount: 65,
                upvotes: [user1._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f0'),
                title: 'Nên dùng populate hay aggregate khi cần đếm bình luận???????',
                content: 'Trong Mongoose, khi hiển thị danh sách bài viết kèm số lượng bình luận, việc dùng populate(\'comments\') rồi đo độ dài mảng có làm tốn RAM quá không? Nên dùng aggregate $lookup và $size thay thế đúng không?',
                author: user1._id,
                postType: 'question',
                tags: ['mongodb'],
                status: 'unresolved',
                viewCount: 154,
                upvotes: [user2._id, user3._id],
                downvotes: [],
                likes: [user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f1'),
                title: 'Cách debug CORS giữa Vite và Express',
                content: 'Mình chạy client Vite ở port 5173 và server Express ở port 5000, gọi API bị lỗi Blocked by CORS policy. Đã dùng app.use(cors()) nhưng vẫn bị. Làm sao cấu hình đúng origins và credentials?',
                author: user2._id,
                postType: 'question',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 204,
                upvotes: [user1._id, user3._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f2'),
                title: 'Gợi ý viết CV thực tập backend cho sinh viên năm 3',
                content: 'Lời khuyên cho các bạn chuẩn bị đi thực tập: Tập trung vào các project cá nhân có thực tế, ghi rõ công nghệ sử dụng, giải thích kiến trúc DB và kỹ năng giải quyết vấn đề thay vì viết chung chung.',
                author: user3._id,
                postType: 'advice',
                tags: ['python', 'java'],
                status: 'unresolved',
                viewCount: 420,
                upvotes: [user1._id, user2._id, user4._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f3'),
                title: 'Index MongoDB nào phù hợp cho tìm bài viết theo tag và thời gian?',
                content: 'Bài đăng có chứa nhiều tag và sắp xếp theo ngày tạo giảm dần. Mình nên tạo Single index { tags: 1 } hay Compound index { tags: 1, createdAt: -1 } để tối ưu query?',
                author: user2._id,
                postType: 'question',
                tags: ['mongodb'],
                status: 'unresolved',
                bestAnswer: null, // Sẽ gán sau khi tạo bình luận
                viewCount: 88,
                upvotes: [user1._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f4'),
                title: 'Cách đặt tên component React dễ đọc hơn',
                content: 'Sử dụng PascalCase cho Component, camelCase cho hooks, và tổ chức cấu trúc thư mục dạng Domain-driven để dự án dễ bảo trì hơn khi mở rộng quy mô.',
                author: user5._id,
                postType: 'advice',
                tags: ['react'],
                status: 'unresolved',
                viewCount: 160,
                upvotes: [user1._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f5'),
                title: 'Socket.io có cần thiết cho thông báo bình luận mới không?',
                content: 'Chúng tôi đang phân vân giữa WebSockets (Socket.io) và Server-Sent Events (SSE) để làm tính năng realtime notify khi có bình luận mới. Lựa chọn nào nhẹ hơn cho backend?',
                author: user1._id,
                postType: 'question',
                tags: ['nodejs'],
                status: 'unresolved',
                viewCount: 92,
                upvotes: [user3._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f6'),
                title: 'Phân biệt upvote/downvote với like/dislike trong forum',
                content: 'Upvote/Downvote ảnh hưởng trực tiếp đến thứ hạng bài đăng và điểm uy tín của tác giả (Reputation), còn Like/Dislike chỉ thể hiện cảm xúc đơn thuần mà không làm thay đổi điểm số hệ thống.',
                author: user3._id,
                postType: 'advice',
                tags: ['javascript'],
                status: 'unresolved',
                viewCount: 180,
                upvotes: [user1._id, user2._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f7'),
                title: 'Học networking qua việc tự trace một request HTTP',
                content: 'Hãy dùng Wireshark để bắt và phân tích gói tin khi gõ google.com trên trình duyệt. Bạn sẽ hiểu rõ cơ chế bắt tay 3 bước TCP, quá trình phân giải DNS và bản tin HTTP thực sự trông như thế nào.',
                author: user5._id,
                postType: 'advice',
                tags: ['javascript'],
                status: 'unresolved',
                viewCount: 290,
                upvotes: [user1._id, user2._id, user3._id],
                downvotes: [],
                likes: [user1._id, user2._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f8'),
                title: 'Reset password bằng OTP nên hết hạn sau bao lâu?',
                content: 'Thông thường mã OTP gửi qua SMS hoặc email chỉ nên có hiệu lực từ 2 đến 5 phút để tránh nguy cơ tấn công brute-force. Đồng thời nên giới hạn gửi lại mã tối đa 3 lần mỗi 15 phút.',
                author: user2._id,
                postType: 'question',
                tags: ['nodejs'],
                status: 'unresolved',
                viewCount: 112,
                upvotes: [user1._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f9'),
                title: 'Cách chuẩn bị dữ liệu mẫu để demo đồ án',
                content: 'Nên viết sẵn một script seed CSDL bằng Javascript sử dụng thư viện như Faker để tự động sinh ra hàng trăm bài viết, hàng ngàn bình luận, giúp giao diện trông thực tế và sinh động hơn khi demo.',
                author: user3._id,
                postType: 'advice',
                tags: ['javascript', 'mongodb'],
                status: 'unresolved',
                viewCount: 172,
                upvotes: [user1._id, user2._id, user5._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7fa'),
                title: 'Python có phù hợp để viết script seed database không?',
                content: 'Hoàn toàn phù hợp. Thư viện pymongo và Faker trong Python rất mạnh mẽ và dễ viết. Tuy nhiên, nếu toàn bộ dự án viết bằng Node.js, nên dùng luôn Javascript để tái sử dụng các Models của Mongoose.',
                author: user1._id,
                postType: 'question',
                tags: ['python', 'mongodb'],
                status: 'unresolved',
                viewCount: 82,
                upvotes: [user3._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7fb'),
                title: 'Tối ưu trang hồ sơ công khai cho diễn đàn sinh viên',
                content: 'Hồ sơ cá nhân nên hiển thị các thống kê trực quan về bài viết đã đăng, tổng số lượt xem, upvote nhận được, các tag thế mạnh và lịch sử tăng điểm danh tiếng của thành viên.',
                author: user5._id,
                postType: 'advice',
                tags: ['react'],
                status: 'unresolved',
                viewCount: 135,
                upvotes: [user1._id, user2._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];
        const posts = await Post.insertMany(postsData);
        console.log(`Seeded ${posts.length} posts.`);

        const postReactUnresolved = posts[0]; // useEffect 2 times
        const postMongoSchema = posts[1];
        const postMongoIndexResolved = posts[11]; // Index MongoDB

        // 5. Seed Comments & Nested Replies
        console.log('Seeding comments...');
        const commentDatas = [
            // Comments for React useEffect post
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a0'),
                content: 'Đây là cơ chế hoàn toàn bình thường của React 18+ khi chạy trong môi trường development với StrictMode nhằm phát hiện các hiệu ứng phụ (side effects) chưa được dọn dẹp sạch sẽ.',
                author: user1._id,
                post: postReactUnresolved._id,
                parentComment: null,
                likes: [user3._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a1'),
                content: 'Chuẩn luôn! Khi chạy ở Production thì nó chỉ gọi một lần duy nhất thôi nên bạn không cần quá lo lắng nhé.',
                author: user2._id,
                post: postReactUnresolved._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a0'), // Reply to above
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a2'),
                content: 'Cảm ơn hai bạn nhiều! Giờ mình đã hiểu tại sao nó lại gọi 2 lần rồi. Mình sẽ viết cleanup function để hủy các API request chưa hoàn thành.',
                author: user4._id, // Tác giả bài viết (Trần Quốc Bảo) trả lời/bình luận
                post: postReactUnresolved._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a1'),
                likes: [user1._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },

            // Comments for MongoDB Schema post
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a3'),
                content: 'Đối với hệ thống bình luận lồng nhau nhiều cấp, không nên dùng Embedding vì tài liệu MongoDB có giới hạn kích thước 16MB. Bạn nên dùng Referencing kết hợp thuộc tính parentComment ID.',
                author: user2._id,
                post: postMongoSchema._id,
                parentComment: null,
                likes: [user1._id, user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },

            // Comments for MongoDB Index resolved post
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a4'),
                content: 'Bạn nên sử dụng Compound index { tags: 1, createdAt: -1 } vì query của bạn thực hiện filter theo tag trước rồi mới sắp xếp theo thời gian giảm dần.',
                author: user3._id,
                post: postMongoIndexResolved._id,
                parentComment: null,
                likes: [user2._id, user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a5'),
                content: 'Cảm ơn anh Cường nhé, giải thích rất dễ hiểu. Em đã tạo index này và tốc độ truy vấn từ 120ms giảm xuống còn dưới 5ms!',
                author: user2._id, // Tác giả bài viết
                post: postMongoIndexResolved._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a4'),
                likes: [user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            }
        ];
        const comments = await Comment.insertMany(commentDatas);
        console.log(`Seeded ${comments.length} comments.`);

        // Cập nhật accepted answer cho post resolved
        const bestComment = comments.find(c => c._id.toString() === '6a364719a1b07db4bbeff8a4');
        if (bestComment) {
            await Post.findByIdAndUpdate(postMongoIndexResolved._id, { $set: { bestAnswer: bestComment._id } });
            console.log('Set bestAnswer for MongoDB Index resolved post.');
        }

        // 6. Seed Report Tickets (Flags)
        console.log('Seeding report tickets (flags)...');
        const reportTicketsData = [
            {
                post: postReactUnresolved._id,
                reporter: user2._id,
                flagType: 'needs_detail',
                details: 'Thiếu thông tin chi tiết về phiên bản React đang chạy.',
                status: 'submitted',
                outcome: 'pending',
                history: [
                    { status: 'submitted', note: 'Người dùng gửi cờ báo cáo thiếu thông tin.', actorRole: 'user', actor: user2._id, createdAt: new Date() }
                ],
                createdAt: new Date()
            }
        ];
        await ReportTicket.insertMany(reportTicketsData);

        // 7. Seed Reputation History
        console.log('Seeding reputation history...');
        const reputationHistoriesData = [
            {
                user: user4._id, // Trần Quốc Bảo nhận điểm từ upvote bài React useEffect
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote',
                reputationEarned: 10,
                targetId: postReactUnresolved._id,
                voter: user1._id,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                user: user4._id, // Trần Quốc Bảo bị trừ điểm từ downvote
                type: 'post_downvoted',
                title: 'Bài viết bị Downvote',
                reputationEarned: -2,
                targetId: postReactUnresolved._id,
                voter: user5._id,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
        ];
        await ReputationHistory.insertMany(reputationHistoriesData);

        // 8. Seed Donation Transactions
        console.log('Seeding donation transactions...');
        const donationDatas = [
            {
                donor: user1._id,
                author: user4._id, // Nguyễn Văn An quyên góp ủng hộ Trần Quốc Bảo
                post: postReactUnresolved._id,
                amount: 50000,
                paymentMethod: 'cod',
                status: 'completed',
                note: 'Cảm ơn bài chia sẻ rất thực tế!',
                donorSnapshot: { fullName: user1.fullName, avatar: user1.avatar, major: user1.major },
                authorSnapshot: { fullName: user4.fullName, avatar: user4.avatar, major: user4.major },
                postSnapshot: { title: postReactUnresolved.title },
                completedAt: new Date(),
                createdAt: new Date()
            }
        ];
        await DonationTransaction.insertMany(donationDatas);
        console.log('Donation transactions seeded.');

        console.log('🌱 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

seed();
