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

// Shared password hash (decodes to "123456")
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

        // 2. Seed Users (15 users total: 2 admins, 13 standard users)
        console.log('Seeding users...');
        const userDatas = [
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d0'),
                fullName: 'Admin Administrator',
                email: 'admin@itforum.local',
                password: demoPassword,
                role: 'admin',
                isActive: true,
                status: 'active',
                phone: '0987654321',
                bio: 'Hệ thống Quản trị viên chính của IT Forum. Chịu trách nhiệm kiểm duyệt hệ thống và bảo trì cơ sở dữ liệu.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
                major: 'Công nghệ thông tin',
                reputation: 999,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7de'),
                fullName: 'Nguyễn Minh Tâm',
                email: 'admin2@itforum.local',
                password: demoPassword,
                role: 'admin',
                isActive: true,
                status: 'active',
                phone: '0988888888',
                bio: 'Phó ban kiểm duyệt. Chuyên gia phân tích log và giải quyết các khiếu nại cờ báo cáo vi phạm.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=tam',
                major: 'Kỹ thuật phần mềm',
                reputation: 500,
                createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d1'),
                fullName: 'Nguyễn Văn An',
                email: 'user1@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0912345678',
                bio: 'Lập trình viên Web đam mê JavaScript, React, và Node.js. Rất vui được trao đổi kỹ thuật cùng các bạn.',
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
                status: 'active',
                phone: '0923456789',
                bio: 'Database Administrator & Backend Engineer. Thích tối ưu hóa hiệu năng truy vấn lớn và viết API.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user2',
                major: 'Hệ thống thông tin',
                reputation: 120,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d3'),
                fullName: 'Lê Hoàng Cường',
                email: 'user3@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0934567890',
                bio: 'Cựu tuyển thủ Olympic Tin học, thích nghiên cứu giải thuật nâng cao và trí tuệ nhân tạo.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user3',
                major: 'Khoa học máy tính',
                reputation: 210,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d4'),
                fullName: 'Phạm Minh Duy',
                email: 'user4@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0945678901',
                bio: 'Sinh viên năm 2 đang tìm hiểu React, NextJS và các giải pháp tối ưu UI/UX.',
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
                status: 'active',
                phone: '0956789012',
                bio: 'Lập trình viên Backend với Java (Spring Boot) và C# (.NET Core). Nghiện cấu hình Docker.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user5',
                major: 'Công nghệ phần mềm',
                reputation: 60,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d6'),
                fullName: 'Vũ Thị Hương',
                email: 'user6@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0967890123',
                bio: 'Yêu thích mật mã học, phân tích mã độc và nghiên cứu các lỗ hổng mạng không dây.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user6',
                major: 'An toàn thông tin',
                reputation: 180,
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d7'),
                fullName: 'Phạm Văn Giang',
                email: 'user7@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0978901234',
                bio: 'Kỹ sư Machine Learning tương lai. Thường trực trên Kaggle và StackOverflow.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user7',
                major: 'Khoa học máy tính',
                reputation: 140,
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d8'),
                fullName: 'Đỗ Minh Hải',
                email: 'user8@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0989012345',
                bio: 'Sysadmin & Cloud Specialist. Có niềm đam mê mãnh liệt với CI/CD, Kubernetes và Automation.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user8',
                major: 'Mạng máy tính và Truyền thông dữ liệu',
                reputation: 250,
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7d9'),
                fullName: 'Bùi Thị Kim',
                email: 'user9@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0990123456',
                bio: 'Lập trình viên Mobile chuyên nghiệp. React Native, Flutter, Swift - cân hết mọi nền tảng.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user9',
                major: 'Kỹ thuật phần mềm',
                reputation: 85,
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7da'),
                fullName: 'Ngô Văn Lâm',
                email: 'user10@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0901234567',
                bio: 'Nhà phát triển game độc lập. Đam mê Unity, đồ họa C++ và thiết kế màn chơi.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user10',
                major: 'Công nghệ thông tin',
                reputation: 50,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7db'),
                fullName: 'Dương Quốc Nam',
                email: 'user11@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0911234567',
                bio: 'Lập trình viên phần cứng và nhúng. Yêu thích các mạch STM32, Arduino, ESP32.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user11',
                major: 'Kỹ thuật máy tính',
                reputation: 45,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7dc'),
                fullName: 'Phùng Thị Oanh',
                email: 'user12@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0922345678',
                bio: 'UI/UX Designer tâm huyết. Thích vẽ wireframe, tạo prototype và phân tích hành vi người dùng.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user12',
                major: 'Hệ thống thông tin',
                reputation: 130,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7dd'),
                fullName: 'Lý Hoàng Phong',
                email: 'user13@itforum.local',
                password: demoPassword,
                role: 'user',
                isActive: true,
                status: 'active',
                phone: '0933456789',
                bio: 'Fullstack Developer. Yêu thích sự thực dụng của TypeScript và hiệu năng của NestJS / Go.',
                avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user13',
                major: 'Kỹ thuật phần mềm',
                reputation: 310,
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            }
        ];
        const users = await User.insertMany(userDatas);
        console.log(`Seeded ${users.length} users.`);

        const [
            admin1, admin2, user1, user2, user3, user4, user5,
            user6, user7, user8, user9, user10, user11, user12, user13
        ] = users;

        // 3. Seed Tags (18 Tags total)
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
            { name: 'Git', description: 'Hệ thống quản lý phiên bản phân tán phổ biến nhất.' },
            { name: 'TypeScript', description: 'Siêu tập tĩnh của JavaScript, giúp viết mã nguồn an toàn và dễ bảo trì.' },
            { name: 'NextJS', description: 'Framework React hỗ trợ Server Side Rendering và Static Site Generation.' },
            { name: 'CSS', description: 'Cascading Style Sheets dùng để định dạng và tạo kiểu dáng cho trang web.' },
            { name: 'HTML5', description: 'Ngôn ngữ đánh dấu siêu văn bản phiên bản mới nhất.' },
            { name: 'CyberSecurity', description: 'An toàn bảo mật thông tin, chống mã độc và tấn công mạng.' },
            { name: 'MachineLearning', description: 'Lĩnh vực nghiên cứu giúp máy tính tự học hỏi từ dữ liệu.' },
            { name: 'GoLang', description: 'Ngôn ngữ lập trình biên dịch nhanh, hiệu năng cao từ Google.' }
        ];

        const tags = await Tag.insertMany(
            tagDatas.map(t => ({
                ...t,
                slug: slugify(t.name)
            }))
        );
        console.log(`Seeded ${tags.length} tags.`);

        // 4. Seed Posts (25 Detailed Posts)
        console.log('Seeding posts...');
        const postsData = [
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e1'),
                title: 'Hỏi về cách tối ưu hóa query skip và limit trong MongoDB khi dữ liệu lớn',
                content: `Chào mọi người, mình đang làm chức năng phân trang cho một bảng dữ liệu chứa khoảng hơn 10 triệu dòng trên MongoDB. Hiện tại mình đang sử dụng phương pháp phân trang truyền thống bằng cách kết hợp \`skip\` và \`limit\`.

Công thức hiện tại của mình là:
\`\`\`javascript
db.collection.find().skip(page * limit).limit(limit)
\`\`\`

Tuy nhiên, mình gặp vấn đề nghiêm trọng là khi chuyển qua các trang cuối (ví dụ trang thứ 10,000 trở đi), tốc độ phản hồi từ database cực kỳ chậm (mất từ 3s - 5s cho một query). Qua tìm hiểu thì mình biết là MongoDB phải quét qua toàn bộ số lượng documents bị bỏ qua thì mới lấy ra được trang tiếp theo.

Có giải pháp hay thuật toán phân trang nào tối ưu hơn không? Ví dụ như Cursor-based pagination hay lưu trữ điểm đánh dấu (keyset pagination) thì triển khai cụ thể ra sao? Rất mong được mọi người tư vấn và cho ví dụ cụ thể. Cảm ơn nhiều!`,
                author: user2._id,
                postType: 'question',
                tags: ['mongodb', 'sql', 'nodejs'],
                status: 'unresolved',
                viewCount: 1420,
                dailyViewCount: 15,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user3._id, user5._id, user8._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e2'),
                title: 'Hướng dẫn cấu hình luồng CI/CD hoàn chỉnh với GitHub Actions và Docker',
                content: `Chào các bạn, hôm nay mình xin chia sẻ kinh nghiệm xây dựng luồng CI/CD cơ bản nhưng cực kỳ hiệu quả sử dụng **GitHub Actions** để tự động đóng gói ứng dụng Node.js vào **Docker Container** và tự động deploy lên máy chủ VPS.

### Lợi ích của luồng này:
1. Đảm bảo mã nguồn chạy được trên mọi môi trường nhờ tính nhất quán của Docker.
2. Tự động kiểm thử và build mỗi khi bạn thực hiện push hoặc merge vào nhánh \`main\`.
3. Giảm thiểu rủi ro khi deploy thủ công bằng FTP/SSH.

### File cấu hình Workflow: \`.github/workflows/deploy.yml\`
Dưới đây là file YAML mình đã tối ưu:

\`\`\`yaml
name: Deploy Application

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker image
        run: |
          docker build -t myapp:latest .
          docker tag myapp:latest \${{ secrets.DOCKER_USERNAME }}/myapp:latest
          docker push \${{ secrets.DOCKER_USERNAME }}/myapp:latest

      - name: SSH and Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: \${{ secrets.VPS_HOST }}
          username: \${{ secrets.VPS_USER }}
          key: \${{ secrets.VPS_SSH_KEY }}
          script: |
            docker pull \${{ secrets.DOCKER_USERNAME }}/myapp:latest
            docker stop myapp || true
            docker rm myapp || true
            docker run -d --name myapp -p 80:3000 \${{ secrets.DOCKER_USERNAME }}/myapp:latest
\`\`\`

Hy vọng bài viết này giúp các bạn sinh viên dễ dàng tiếp cận công nghệ DevOps để chuẩn bị tốt cho đồ án tốt nghiệp!`,
                author: user8._id,
                postType: 'advice',
                tags: ['docker', 'git', 'nodejs'],
                status: 'unresolved',
                viewCount: 3105,
                dailyViewCount: 45,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user3._id, user5._id, user9._id, user13._id],
                downvotes: [],
                likes: [user1._id, user2._id, user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e3'),
                title: 'So sánh hiệu năng giữa React Virtualized và React Window khi render 10,000 dòng',
                content: `Khi phát triển các ứng dụng quản lý, việc hiển thị các danh sách lớn hoặc bảng biểu với hàng chục ngàn bản ghi là điều thường xuyên xảy ra. Nếu chúng ta dùng thẻ map thông thường để render toàn bộ 10,000 DOM elements cùng lúc, trình duyệt chắc chắn sẽ bị lag hoặc đơ do quá trình vẽ lại (repaint) và tính toán vị trí quá tải.

Giải pháp ở đây chính là kỹ thuật **Virtual Scroll** (cuộn ảo). Nó chỉ render các phần tử nằm trong khung nhìn hiển thị của người dùng (Viewport).

### So sánh giữa hai thư viện phổ biến:
1. **React Virtualized**: 
   - *Ưu điểm*: Rất nhiều tính năng đi kèm (Bảng, Lưới, Tự động đo kích thước, Danh sách động).
   - *Nhược điểm*: Dung lượng bundle size khá nặng, cấu hình tương đối phức tạp và đôi khi dư thừa tính năng.
2. **React Window**:
   - *Ưu điểm*: Phiên bản rút gọn và tối ưu hóa của chính tác giả viết React Virtualized. Dung lượng cực nhẹ (chỉ khoảng 6kB), tốc độ render nhanh hơn đáng kể.
   - *Nhược điểm*: Thiếu một số component phức tạp, bạn phải tự tuỳ biến nhiều hơn.

### Code ví dụ với React Window:
\`\`\`javascript
import { FixedSizeList as List } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style} className="border-b px-4 py-2">
    Hàng số {index} - Dữ liệu thực tế
  </div>
);

const App = () => (
  <List
    height={400}
    itemCount={10000}
    itemSize={35}
    width={600}
  >
    {Row}
  </List>
);
\`\`\`

*Lời khuyên*: Nếu dự án của bạn chỉ cần hiển thị danh sách dạng cột đơn giản, hãy luôn ưu tiên chọn **React Window** để ứng dụng mượt mà nhất.`,
                author: user1._id,
                postType: 'advice',
                tags: ['react', 'javascript'],
                status: 'unresolved',
                viewCount: 1980,
                dailyViewCount: 22,
                dailyViewDate: new Date(),
                upvotes: [user4._id, user9._id, user12._id],
                downvotes: [],
                likes: [user4._id, user9._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e4'),
                title: 'Tại sao Node.js Single Thread vẫn xử lý được hàng ngàn request cùng lúc?',
                content: `Em xin chào các anh chị tiền bối. Em là sinh viên năm nhất đang học môn Hệ điều hành và Lập trình mạng. Em có một thắc mắc nhỏ về cơ chế hoạt động của Node.js mong được giải đáp.

Theo em được biết, đa số các web server truyền thống như Apache sử dụng mô hình **Multi-threaded** (mỗi request từ client sẽ được giao cho một luồng (thread) xử lý riêng). Trong khi đó, Node.js lại chạy trên mô hình **Single-threaded** (chỉ có duy nhất một luồng chính để xử lý sự kiện).

Lý thuyết là thế, nhưng tại sao Node.js lại nổi tiếng với khả năng xử lý lượng truy cập đồng thời (concurrency) rất cao và chịu tải I/O tốt? 

*   Nếu luồng chính đó đang bận truy vấn cơ sở dữ liệu hoặc đọc file nặng, nó có làm nghẽn toàn bộ các request khác từ các client khác không?
*   Cơ chế **Event Loop** và **Libuv Thread Pool** phối hợp với nhau như thế nào trong trường hợp này?

Mong nhận được các câu trả lời chuyên sâu và thực tế để em hiểu rõ hơn bản chất bên dưới. Em xin cảm ơn!`,
                author: user3._id,
                postType: 'question',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 920,
                dailyViewCount: 8,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user5._id, user13._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e5'),
                title: 'Kinh nghiệm chống tấn công SQL Injection và XSS cho người mới bắt đầu',
                content: `Bảo mật thông tin luôn là vấn đề bị bỏ quên nhiều nhất khi các bạn sinh viên làm đồ án môn học hoặc xây dựng các sản phẩm thực tế đầu tay. Trong bài viết này, mình sẽ nói về 2 lỗ hổng kinh điển là **SQL Injection** và **XSS (Cross-Site Scripting)** cùng các biện pháp ngăn ngừa cơ bản.

### 1. SQL Injection
*   **Nguyên nhân**: Do lập trình viên trực tiếp cộng chuỗi đầu vào từ người dùng vào truy vấn SQL mà không qua bước chuẩn hóa (sanitize).
*   **Ví dụ nguy hiểm**:
    \`\`\`sql
    -- Query nguy hiểm:
    SELECT * FROM Users WHERE username = '' OR '1'='1' AND password = '...';
    \`\`\`
*   **Khắc phục**: 
    - Luôn dùng **Prepared Statements** (hoặc Parametized Queries).
    - Sử dụng các thư viện ORM/ODM tên tuổi như Sequelize, Mongoose, Entity Framework để tự động hóa việc bind tham số.

### 2. XSS (Cross-Site Scripting)
*   **Nguyên nhân**: Hacker chèn các đoạn mã độc Javascript vào database thông qua form nhập liệu (bình luận, tên tài khoản). Khi người dùng khác truy cập trang web, trình duyệt sẽ tự động thực thi mã độc này.
*   **Khắc phục**:
    - Escape toàn bộ ký tự đặc biệt ở cả Front-end lẫn Back-end (\`<\` thành \`&lt;\`, v.v.).
    - Sử dụng thư viện lọc mã độc như \`dompurify\` trước khi hiển thị dữ liệu thô (raw HTML).
    - Sử dụng cookie thuộc tính \`httpOnly\` để lưu trữ JWT Token nhằm tránh bị đánh cắp cookie qua mã độc JS.

Hãy tập thói quen viết code an toàn ngay từ hôm nay để bảo vệ dữ liệu người dùng!`,
                author: user6._id,
                postType: 'advice',
                tags: ['cybersecurity', 'sql', 'javascript'],
                status: 'unresolved',
                viewCount: 1560,
                dailyViewCount: 18,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user3._id, user8._id],
                downvotes: [],
                likes: [user1._id, user3._id, user8._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e6'),
                title: 'Lộ trình tự học Machine Learning từ Toán cơ bản đến Model Deployment',
                content: `Để giúp các bạn định hướng nghiên cứu Trí tuệ nhân tạo hiệu quả hơn, mình xin tổng hợp lộ trình 4 giai đoạn tự học Machine Learning từ kinh nghiệm cá nhân của mình:

### Giai đoạn 1: Nền tảng Toán học
Đừng nhảy ngay vào code thư viện mà hãy hiểu bản chất đằng sau các thuật toán:
- **Đại số tuyến tính**: Vectors, Matrices, Matrix multiplication, Eigenvalues & Eigenvectors.
- **Giải tích**: Derivatives, Gradients, Partial derivatives (dùng cho thuật toán tối ưu Gradient Descent).
- **Xác suất thống kê**: Bayes Theorem, Probability distributions, Mean, Variance.

### Giai đoạn 2: Lập trình & Tiền xử lý dữ liệu
- Học ngôn ngữ **Python** một cách bài bản.
- Làm chủ bộ ba thư viện: \`NumPy\` (tính toán số học), \`Pandas\` (quản lý bảng dữ liệu), và \`Matplotlib/Seaborn\` (vẽ biểu đồ trực quan).

### Giai đoạn 3: Thuật toán Machine Learning kinh điển
- Thực hành xây dựng các thuật toán cơ bản với \`Scikit-Learn\`:
  - Phân lớp (Classification): Logistic Regression, SVM, Random Forest.
  - Hồi quy (Regression): Linear Regression.
  - Phân cụm (Clustering): K-Means.

### Giai đoạn 4: Đưa Model lên Production (Deployment)
- Đóng gói mô hình đã huấn luyện thành file binary (như \`.pkl\`, \`.onnx\`).
- Viết REST API sử dụng **FastAPI** để expose endpoint dự đoán.
- Deploy API đó lên các nền tảng đám mây bằng Docker.

Chúc các bạn sớm làm chủ công nghệ thú vị này!`,
                author: user7._id,
                postType: 'advice',
                tags: ['machinelearning', 'python'],
                status: 'unresolved',
                viewCount: 2240,
                dailyViewCount: 30,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user3._id, user8._id, user13._id],
                downvotes: [],
                likes: [user1._id, user3._id, user13._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e7'),
                title: 'Thiết kế RESTful API chuẩn: Nên trả về HTTP Status Code nào cho đúng?',
                content: `Hiện nay mình thấy rất nhiều bạn phát triển API gặp tình trạng lạm dụng mã \`200 OK\` cho mọi loại phản hồi, kể cả khi xảy ra lỗi. Việc này gây khó khăn lớn cho việc tích hợp của Client.

Dưới đây là cẩm nang thiết kế chuẩn mực:

- **200 OK**: Trả về dữ liệu thành công cho các request \`GET\`, \`PUT\`, \`PATCH\`.
- **201 Created**: Dùng riêng cho request \`POST\` tạo tài nguyên mới thành công.
- **204 No Content**: Xử lý xóa thành công (\`DELETE\`) và không cần trả về body.
- **400 Bad Request**: Client gửi dữ liệu sai định dạng cấu trúc JSON yêu cầu.
- **401 Unauthorized**: Yêu cầu xác thực tài khoản đăng nhập (chưa login/Token hết hạn).
- **403 Forbidden**: Người dùng đã đăng nhập nhưng không có quyền truy cập chức năng này (ví dụ: User thường đòi vào Dashboard của Admin).
- **404 Not Found**: Tài nguyên không tồn tại.
- **422 Unprocessable Entity**: Lỗi nghiệp vụ (ví dụ: số dư tài khoản không đủ để mua hàng).
- **500 Internal Server Error**: Lỗi phát sinh từ server (crash code, mất kết nối DB).

Hãy tuân thủ chuẩn REST để dự án của bạn dễ bảo trì và mở rộng hơn!`,
                author: user13._id,
                postType: 'advice',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 1100,
                dailyViewCount: 12,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user5._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e8'),
                title: 'Cách chia layout responsive trong CSS: Grid vs Flexbox khi nào nên dùng?',
                content: `Em đang học thiết kế layout giao diện cho trang tin tức. Em có tham khảo một số code mẫu trên mạng thì thấy có chỗ họ viết bằng Grid, chỗ khác lại viết hoàn toàn bằng Flexbox.

Mọi người có thể cho em hỏi sự khác biệt cốt lõi giữa **CSS Grid** và **CSS Flexbox** là gì?
- Đối với giao diện chia dạng lưới như bộ lọc danh mục sản phẩm hay bảng điều khiển admin, dùng cái nào sẽ đỡ cực hơn?
- Liệu có nên kết hợp cả hai trong cùng một dự án không? Ví dụ như dùng Grid chia cột lớn, còn Flexbox căn chỉnh các thành phần con bên trong.

Rất mong được mọi người chia sẻ kinh nghiệm thiết kế thực tế để em tối ưu giao diện web của mình.`,
                author: user12._id,
                postType: 'question',
                tags: ['css', 'html5'],
                status: 'unresolved',
                viewCount: 650,
                dailyViewCount: 6,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user4._id, user9._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7e9'),
                title: 'Xử lý State Management trong NextJS App Router: Nên dùng Redux Toolkit hay Zustand?',
                content: `Mình đang bắt đầu chuyển đổi một dự án React lớn sang NextJS sử dụng kiến trúc App Router mới. Một vấn đề mình đang rất đắn đo là lựa chọn giải pháp quản lý trạng thái (State Management) phù hợp.

Trước đây mình dùng **Redux Toolkit** rất quen tay. Nhưng khi sang NextJS với mô hình Server Components mặc định, việc bọc dự án trong các Context Providers của Redux gây nhiều khó khăn và mất đi lợi thế hiển thị nhanh từ phía Server.

Mình thấy nhiều người khuyên dùng **Zustand** vì cấu trúc gọn nhẹ hơn nhiều.
- Zustand có hoạt động tốt và bảo mật trên môi trường SSR của NextJS không?
- Có cách nào để chia sẻ state giữa Server Components và Client Components một cách mượt mà không?

Rất mong nhận được đóng góp ý kiến từ các anh em đã triển khai thực tế.`,
                author: user9._id,
                postType: 'question',
                tags: ['nextjs', 'react', 'typescript'],
                status: 'unresolved',
                viewCount: 880,
                dailyViewCount: 11,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user4._id, user13._id],
                downvotes: [],
                likes: [user1._id, user13._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ea'),
                title: 'Tại sao nên chuyển từ JavaScript sang TypeScript cho dự án lớn?',
                content: `Nếu bạn đang làm việc trong một nhóm có từ 3 người trở lên hoặc dự án có vòng đời kéo dài hơn 6 tháng, việc tiếp tục sử dụng JavaScript thuần túy là một rủi ro cực kỳ lớn. Hãy chuyển sang **TypeScript** ngay lập tức vì các lý do sau:

### 1. Tránh các lỗi ngớ ngẩn trước khi runtime
Hãy xem đoạn code JS này:
\`\`\`javascript
const user = { name: "An", age: 20 };
console.log(user.agw); // Kết quả: undefined, không có lỗi biên dịch nào!
\`\`\`
Nếu dùng TypeScript, trình biên dịch sẽ cảnh báo ngay lập tức giúp bạn tiết kiệm hàng giờ debug.

### 2. Autocomplete cực đỉnh
Trình biên dịch TypeScript phân tích kiểu dữ liệu của các đối tượng nên IDE (VS Code) có thể tự động gợi ý mọi thuộc tính và tham số của hàm một cách chính xác, tăng tốc độ gõ code lên gấp đôi.

### 3. Tự tin Refactor code
Khi thay đổi tên một hàm hay thuộc tính trong một dự án lớn chứa hàng trăm file, JavaScript là một ác mộng vì bạn phải tìm kiếm thủ công. Với TypeScript, bạn chỉ cần bấm nút Rename Symbol và toàn bộ dự án sẽ được cập nhật an toàn.

Đừng ngần ngại bước ra khỏi vùng an toàn của JavaScript!`,
                author: user13._id,
                postType: 'advice',
                tags: ['typescript', 'javascript'],
                status: 'unresolved',
                viewCount: 1750,
                dailyViewCount: 20,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user3._id, user4._id, user8._id],
                downvotes: [],
                likes: [user1._id, user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7eb'),
                title: 'Hỏi về Go Goroutines: Cách phòng tránh Race Condition và Deadlock?',
                content: `Chào các Go developer! Mình đang tự học lập trình concurrency trong Golang và viết một chương trình tính toán phân tán sử dụng Goroutines để xử lý song song các tác vụ ghi vào file log chung.

Tuy nhiên, khi chạy thử nghiệm, kết quả ghi nhận thỉnh thoảng bị mất dữ liệu hoặc lỗi crash bất thường. Mình đã chạy kiểm thử với cờ kiểm tra race condition:
\`\`\`bash
go test -race
\`\`\`
Vài phát hiện ra lỗi Race Condition nghiêm trọng do nhiều Goroutines truy cập sửa đổi một map cùng một lúc.

Mình muốn hỏi:
1. Nên sử dụng cơ chế bảo vệ nào giữa \`sync.Mutex\` và giao tiếp qua \`Channel\`?
2. Có cách nào để chủ động phát hiện và ngăn ngừa nguy cơ xảy ra Deadlock trong Go không?

Xin cảm ơn!`,
                author: user3._id,
                postType: 'question',
                tags: ['golang'],
                status: 'unresolved',
                viewCount: 450,
                dailyViewCount: 4,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user8._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ec'),
                title: 'Lập trình Game bằng C++: Nên chọn SFML, SDL hay Unreal Engine?',
                content: `Em là sinh viên năm 2 ngành Khoa học Máy tính. Em rất thích mảng lập trình game và muốn đi sâu vào ngôn ngữ C++.

Hiện tại em đang đứng trước các sự lựa chọn thư viện để bắt đầu viết game:
- **SDL** hoặc **SFML**: Em nghe nói đây là các thư viện đồ họa 2D rất nhẹ, giúp hiểu rõ cơ chế vòng lặp game (Game Loop), xử lý sự kiện phím chuột và vẽ pixel cơ bản.
- **Unreal Engine**: Một Engine 3D khổng lồ sử dụng C++.

Em nên đi từng bước từ các game 2D nhỏ viết bằng SFML để hiểu sâu kiến trúc code game, hay nên lao ngay vào học Unreal Engine để bắt kịp xu hướng thị trường tuyển dụng?

Mong các anh chị đi trước cho em lời khuyên. Em cảm ơn!`,
                author: user10._id,
                postType: 'question',
                tags: ['cpp'],
                status: 'unresolved',
                viewCount: 520,
                dailyViewCount: 5,
                dailyViewDate: new Date(),
                upvotes: [user3._id, user5._id],
                downvotes: [],
                likes: [user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ed'),
                title: 'Cách tổ chức mã nguồn (Project Structure) trong ứng dụng C# .NET Web API',
                content: `Hôm nay mình sẽ hướng dẫn cách cấu trúc mã nguồn theo chuẩn **Clean Architecture** dành cho các dự án phát triển API bằng C# .NET. Việc chia dự án thành các Layer rõ ràng sẽ giúp code của bạn cô lập phần xử lý logic nghiệp vụ khỏi Database hay UI.

### Cấu trúc thư mục chuẩn:
- **Core (Domain)**: Chứa các Entity mô hình hóa cơ sở dữ liệu, các Interface cơ bản và custom Exceptions. Hoàn toàn độc lập, không tham chiếu đến các layer khác.
- **Application**: Chứa Use Cases, các DTOs (Data Transfer Objects), Validator và định nghĩa Business Logic. Layer này chỉ phụ thuộc vào Core.
- **Infrastructure**: Chứa mã kết nối Database thực tế (Entity Framework DbContext), tích hợp gửi mail, dịch vụ bên thứ ba.
- **WebAPI (Presentation)**: Chứa Controllers, Middleware cấu hình xác thực JWT, Routing và file cấu hình ứng dụng \`appsettings.json\`.

Tổ chức dự án khoa học là bước đệm đầu tiên để viết code sạch và dễ dàng thực hiện viết Unit Test!`,
                author: user5._id,
                postType: 'advice',
                tags: ['csharp'],
                status: 'unresolved',
                viewCount: 1120,
                dailyViewCount: 15,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user8._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ee'),
                title: 'Hỏi về các lỗ hổng bảo mật phổ biến trong hợp đồng thông minh Smart Contract',
                content: `Xin chào cộng đồng bảo mật! Mình đang làm đề tài nghiên cứu về an ninh mạng trên công nghệ Blockchain, cụ thể là kiểm thử an toàn các hợp đồng thông minh viết bằng ngôn ngữ Solidity chạy trên mạng lưới Ethereum.

Qua tài liệu nghiên cứu, mình có nghe nói nhiều về các vụ hack gây thất thoát hàng triệu đô la do các lỗi lập trình phổ biến:
- Lỗi gọi ngược vào hàm (**Reentrancy Attack**).
- Lỗi tràn số (**Integer Overflow/Underflow**).
- Lỗi cấu hình sai quyền truy cập hàm (**Access Control Vulnerability**).

Mọi người cho mình hỏi làm thế nào để cấu hình test phòng chống các lỗi này hiệu quả nhất? Có công cụ tự động quét mã nguồn Solidity nào uy tín hỗ trợ sinh viên nghiên cứu không?

Cảm ơn mọi người nhiều!`,
                author: user6._id,
                postType: 'question',
                tags: ['cybersecurity'],
                status: 'unresolved',
                viewCount: 740,
                dailyViewCount: 9,
                dailyViewDate: new Date(),
                upvotes: [user3._id, user7._id, user8._id],
                downvotes: [],
                likes: [user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7ef'),
                title: 'Làm chủ các Git commands nâng cao: Rebase, Cherry-pick và Reflog',
                content: `Git là công cụ quản lý phiên bản không thể thiếu, nhưng đa số lập trình viên mới chỉ sử dụng các lệnh cơ bản như \`add\`, \`commit\` hay \`push/pull\`. Hôm nay mình sẽ hướng dẫn 3 câu lệnh nâng cao giúp tối ưu hóa lịch sử git của nhóm:

### 1. Git Rebase
*   *Khi nào dùng*: Khi bạn muốn đồng bộ code mới nhất từ nhánh \`main\` vào nhánh tính năng của bạn mà không tạo ra các commit merge dư thừa. Lịch sử commit sẽ thẳng hàng tắp cực kỳ đẹp.
*   *Lệnh*:
    \`\`\`bash
    git checkout feature-branch
    git rebase main
    \`\`\`

### 2. Git Cherry-pick
*   *Khi nào dùng*: Khi bạn phát hiện ra một commit hotfix cực kỳ quan trọng ở một nhánh khác và chỉ muốn bê duy nhất commit đó về nhánh hiện tại của mình mà không cần gộp toàn bộ nhánh.
*   *Lệnh*:
    \`\`\`bash
    git cherry-pick <commit-hash>
    \`\`\`

### 3. Git Reflog
*   *Khi nào dùng*: Cứu cánh khi bạn lỡ tay chạy lệnh xóa nhầm nhánh (\`git branch -D\`) hoặc bị mất dấu vết commit do rebase lỗi. Git Reflog lưu lại toàn bộ mọi hành vi di chuyển con trỏ HEAD cục bộ của bạn.
*   *Lệnh*:
    \`\`\`bash
    git reflog
    \`\`\`

Hãy rèn luyện thói quen làm việc chuyên nghiệp cùng Git nhé!`,
                author: user8._id,
                postType: 'advice',
                tags: ['git'],
                status: 'unresolved',
                viewCount: 1650,
                dailyViewCount: 20,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user3._id, user13._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1556075798-482a134b683a?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f0'),
                title: 'Sử dụng Docker Compose để chạy môi trường Local: NodeJS + Redis + PostgreSQL',
                content: `Chào anh em, việc cài đặt thủ công từng dịch vụ như PostgreSQL hay Redis lên hệ điều hành cá nhân luôn tiềm ẩn nhiều rủi ro về xung đột phiên bản phần mềm. Bài viết này hướng dẫn cấu hình nhanh file \`docker-compose.yml\` để chạy toàn bộ môi trường lập trình cục bộ chỉ trong 1 lệnh duy nhất.

### File cấu hình \`docker-compose.yml\`:
\`\`\`yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secretpassword@db:5432/forum_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: forum_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"

volumes:
  pgdata:
\`\`\`

### Cách chạy:
Bạn chỉ cần mở Terminal tại thư mục chứa file trên và gõ:
\`\`\`bash
docker-compose up -d
\`\`\`
Hệ thống sẽ tự tải và thiết lập môi trường hoàn hảo cho bạn làm việc!`,
                author: user8._id,
                postType: 'advice',
                tags: ['docker', 'sql', 'nodejs'],
                status: 'unresolved',
                viewCount: 1450,
                dailyViewCount: 19,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user13._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f1'),
                title: 'Học Java Spring Boot: Nên chọn Maven hay Gradle để build dự án?',
                content: `Em chào mọi người ạ. Em đang bắt đầu học phát triển Backend với Java Spring Boot. Khi khởi tạo dự án mới trên trang \`start.spring.io\`, em thấy có hai sự lựa chọn chính là **Maven Project** và **Gradle Project**.

Em chưa hiểu rõ điểm mạnh và điểm yếu của hai công cụ quản lý build này:
- Cú pháp XML dài dòng của file \`pom.xml\` trong Maven có ảnh hưởng nhiều đến hiệu năng của dự án lớn không?
- Em nghe nói Gradle sử dụng mã cấu hình bằng Groovy/Kotlin nên compile nhanh hơn, nhưng lại khó học hơn Maven.

Dành cho người mới bắt đầu học đi làm thực tế thì em nên tập trung làm quen với công cụ nào hơn ạ?`,
                author: user5._id,
                postType: 'question',
                tags: ['java'],
                status: 'unresolved',
                viewCount: 590,
                dailyViewCount: 7,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user13._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f2'),
                title: 'Làm sao để triển khai hệ thống IoT thu thập cảm biến nhiệt độ dùng ESP32?',
                content: `Chào cộng đồng IoT sinh viên! Mình đang thực hiện đồ án thiết bị nhà thông minh. Mục tiêu là thu thập chỉ số nhiệt độ và độ ẩm phòng định kỳ mỗi 5 giây gửi về máy chủ trung tâm.

Thiết bị của mình gồm:
- Vi điều khiển **ESP32 DevKit**.
- Cảm biến **DHT22**.

Hiện tại mình đang viết firmware bằng C++ trong Arduino IDE, gửi trực tiếp dữ liệu qua giao thức MQTT lên Broker HiveMQ Cloud. Tuy nhiên, khi mất kết nối mạng Wifi tạm thời, ESP32 bị crash hoặc mất hoàn toàn dữ liệu của khoảng thời gian mất mạng đó.

Có cơ chế cache dữ liệu tạm thời trên chip ESP32 (lưu vào bộ nhớ EEPROM hay SPIFFS) để khi có mạng lại thì gửi bù dữ liệu không? Bạn nào có thư viện hay ví dụ code mẫu C++ xử lý mượt vụ này cho mình xin với. Xin chân thành cảm ơn!`,
                author: user11._id,
                postType: 'question',
                tags: ['cpp'],
                status: 'unresolved',
                viewCount: 680,
                dailyViewCount: 8,
                dailyViewDate: new Date(),
                upvotes: [user3._id, user10._id],
                downvotes: [],
                likes: [user3._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f3'),
                title: 'Một số tips thiết kế UI/UX tối ưu cho giao diện Dark Mode',
                content: `Thiết kế Dark Mode đang dần trở thành tiêu chuẩn bắt buộc cho mọi sản phẩm công nghệ. Tuy nhiên, việc chuyển đổi giao diện sáng sang tối không đơn giản là đổi nền trắng thành đen và chữ đen thành trắng.

Dưới đây là một số mẹo hữu ích để bạn thiết kế Dark Mode dễ chịu cho mắt:

### 1. Tránh sử dụng màu đen tuyệt đối (#000000)
Màu đen 100% gây ra hiện tượng mỏi mắt nghiêm trọng do độ tương phản quá gay gắt với chữ trắng sáng. Thay vào đó, hãy dùng các dải màu xám tối (ví dụ: \`#121212\`, \`#1A1A1A\`).

### 2. Giảm độ bão hòa (Saturation) của màu sắc
Các màu rực rỡ nổi bật trên nền trắng sẽ tạo cảm giác chói mắt cực kỳ khó chịu trên nền tối. Hãy làm dịu (mute) các tông màu nhấn của bạn để có trải nghiệm thị giác dễ chịu hơn.

### 3. Đảm bảo độ tương phản đáp ứng chuẩn WCAG 2.0
- Luôn kiểm tra tỉ lệ tương phản chữ/nền bằng các công cụ đo màu. 
- Chuẩn AA yêu cầu tỉ lệ tối thiểu là **4.5:1** cho văn bản thông thường.

Hãy chăm chút trải nghiệm người dùng từ những chi tiết nhỏ nhất!`,
                author: user12._id,
                postType: 'advice',
                tags: ['css'],
                status: 'unresolved',
                viewCount: 1150,
                dailyViewCount: 14,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user4._id, user9._id],
                downvotes: [],
                likes: [user1._id, user4._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f4'),
                title: 'Làm thế nào để scale ứng dụng socket.io lên nhiều cụm (multiple instances)?',
                content: `Mình đang xây dựng tính năng chat trực tuyến thời gian thực cho diễn đàn sử dụng thư viện **Socket.io**. Hiện tại chạy thử nghiệm trên 1 máy chủ VPS đơn lẻ thì hoạt động rất tốt.

Nhưng để chuẩn bị cho giai đoạn hệ thống tải lớn, mình có kế hoạch chạy 4 instances Node.js phía sau bộ cân bằng tải Nginx.

Khi cấu hình như vậy, mình gặp vấn đề: Một client kết nối đến Instance A không thể gửi tin nhắn realtime đến client đang kết nối ở Instance B. Hơn nữa, quá trình bắt tay WebSocket (Handshake) liên tục bị ngắt quãng vì load balancer chuyển tiếp ngẫu nhiên các HTTP request bắt tay đến các instance khác nhau.

- Có phải mình bắt buộc phải cấu hình tính năng sticky sessions trên Nginx không?
- Sử dụng **Redis Adapter** của Socket.io có giúp giải quyết triệt để vấn đề đồng bộ tin nhắn giữa các instance không?

Mong được hướng dẫn kinh nghiệm thực tế. Xin cảm ơn!`,
                author: user1._id,
                postType: 'question',
                tags: ['nodejs', 'javascript', 'mongodb'],
                status: 'unresolved',
                viewCount: 790,
                dailyViewCount: 10,
                dailyViewDate: new Date(),
                upvotes: [user2._id, user3._id, user8._id],
                downvotes: [],
                likes: [user2._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f5'),
                title: 'Nhập môn Lập trình Mobile với React Native: Chia sẻ từ Zero',
                content: `Chào các bạn, hôm nay mình viết bài này để tổng hợp những kinh nghiệm thực tế từ quá trình chuyển mình từ lập trình Web sang viết ứng dụng di động đa nền tảng bằng **React Native**:

### 1. Nên chọn Expo hay React Native CLI?
- **Expo**: Lựa chọn tuyệt vời cho người mới bắt đầu. Không cần cài đặt Android Studio hay Xcode rườm rà. Bạn có thể preview app trực tiếp trên điện thoại cá nhân thông qua mã QR cực kỳ tiện lợi.
- **React Native CLI**: Bắt buộc chọn nếu dự án của bạn đòi hỏi can thiệp sâu vào code Native (Java/Swift) hoặc sử dụng các thư viện phần cứng đặc thù chưa được Expo hỗ trợ.

### 2. Sự khác biệt cơ bản về Styling so với Web
- Trong React Native, không có các thẻ HTML quen thuộc như \`div\` hay \`p\`. Thay vào đó, bạn phải dùng các Core Components tương đương là \`<View>\` và \`<Text>\`.
- Toàn bộ cơ chế dàn trang mặc định sử dụng **Flexbox** và hướng cuộn mặc định là theo chiều dọc (\`flexDirection: 'column'\`).

Chúc các bạn phát triển thành công những ứng dụng di động đầu tiên của mình!`,
                author: user9._id,
                postType: 'advice',
                tags: ['react', 'javascript'],
                status: 'unresolved',
                viewCount: 1320,
                dailyViewCount: 16,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user4._id, user12._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f6'),
                title: 'Cấu hình Next.js Image Optimization: Sử dụng Cloudinary hay server cục bộ?',
                content: `Dự án NextJS của mình có số lượng hình ảnh rất lớn do người dùng tải lên liên tục. Hiện tại mình đang dùng thẻ \`<Image />\` tích hợp sẳn của NextJS để tự động tối ưu hóa và convert ảnh sang định dạng WebP.

Tuy nhiên, mình nhận thấy tài nguyên CPU của máy chủ VPS bị vọt lên rất cao (gần 100%) mỗi khi có nhiều lượt truy cập vào các trang sản phẩm mới, do server phải thực hiện resize hình ảnh trực tiếp (on-the-fly image optimization).

Mình đang cân nhắc chuyển sang sử dụng bên thứ ba để xử lý ảnh:
- Có nên mua gói dịch vụ CDN của **Cloudinary** để đẩy toàn bộ việc xử lý ảnh đi nơi khác không?
- Cấu hình custom loader cho NextJS kết nối Cloudinary có phức tạp lắm không?

Ai có kinh nghiệm tối ưu hóa chi phí và hiệu năng mảng này xin cho mình lời khuyên nhé!`,
                author: user9._id,
                postType: 'question',
                tags: ['nextjs', 'react'],
                status: 'unresolved',
                viewCount: 710,
                dailyViewCount: 8,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user13._id],
                downvotes: [],
                likes: [],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f7'),
                title: 'Hỏi cách sửa lỗi \'Hydration failed because the initial UI does not match\' trong NextJS',
                content: `Chào mọi người, mình đang chạy thử nghiệm một ứng dụng NextJS sử dụng kiến trúc Server-Side Rendering (SSR). Trên Terminal chạy dev thỉnh thoảng hiển thị cảnh báo đỏ rực:

> "Error: Hydration failed because the initial UI does not match what was rendered on the server."

Mình phát hiện ra nguyên nhân là do mình render trực tiếp thời gian tạo tài khoản bằng đối tượng Date cục bộ:
\`\`\`javascript
<div>Thời gian hiện tại: {new Date().toLocaleTimeString()}</div>
\`\`\`
Vì thời gian chạy ở server (khi tạo file HTML) lệch mất vài mili giây so với thời gian chạy trên trình duyệt client, gây ra sự không khớp cấu trúc DOM.

Có cách nào triệt để để xử lý lỗi Hydration này không, đặc biệt khi mình bắt buộc phải hiển thị dữ liệu phụ thuộc vào phía client (như kích thước cửa sổ trình duyệt)?`,
                author: user4._id,
                postType: 'question',
                tags: ['nextjs', 'react'],
                status: 'unresolved',
                viewCount: 960,
                dailyViewCount: 12,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user9._id, user13._id],
                downvotes: [],
                likes: [user1._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f8'),
                title: 'Hướng dẫn viết Unit Test chất lượng cho API Node.js bằng Jest và Supertest',
                content: `Kiểm thử tự động là chiếc khiên vững chắc nhất bảo vệ hệ thống của bạn khi thực hiện tái cấu trúc (refactoring). Hôm nay mình sẽ hướng dẫn viết một test suite hoàn chỉnh kiểm thử API đăng nhập của ứng dụng Express sử dụng hai công cụ là **Jest** và **Supertest**.

### File Test mẫu: \`tests/auth.test.js\`
\`\`\`javascript
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login', () => {
  it('should return 200 and JWT token when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@itforum.local',
        password: '123456'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 401 for incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@itforum.local',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toEqual(401);
  });
});
\`\`\`

Hãy tích hợp kiểm thử tự động vào quy trình phát triển để giảm thiểu các bug ngớ ngẩn khi deploy nhé!`,
                author: user13._id,
                postType: 'advice',
                tags: ['nodejs', 'javascript'],
                status: 'unresolved',
                viewCount: 1250,
                dailyViewCount: 15,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user2._id, user8._id],
                downvotes: [],
                likes: [user1._id, user2._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff7f9'),
                title: 'Phân tích thuật toán sắp xếp nhanh (QuickSort): Cơ chế phân hoạch và hiệu năng',
                content: `Thuật toán sắp xếp nhanh (**QuickSort**) là một trong những thuật toán kinh điển nhất dựa trên tư tưởng "Chia để trị" (Divide and Conquer). Hiểu rõ cách thức phân hoạch dữ liệu sẽ giúp bạn tối ưu hóa tốc độ xử lý khi phỏng vấn giải thuật.

### Cơ chế phân hoạch (Partitioning Scheme)
Ý tưởng cốt lõi là chọn một phần tử chốt (Pivot), sau đó sắp xếp lại mảng sao cho tất cả các phần tử nhỏ hơn Pivot nằm ở bên trái và tất cả các phần tử lớn hơn Pivot nằm ở bên phải.

Có hai thuật toán phân hoạch phổ biến:
1. **Lomuto Partition Scheme**: Dễ hiểu, code ngắn gọn, chọn phần tử cuối làm Pivot. Tuy nhiên hiệu năng kém hơn khi mảng chứa nhiều phần tử trùng lặp.
2. **Hoare Partition Scheme**: Sử dụng hai con trỏ chạy từ hai đầu mảng lại gần nhau. Thực hiện ít phép hoán đổi vị trí hơn Lomuto và chạy nhanh hơn đáng kể trong thực tế.

### Phân tích độ phức tạp thời gian
- **Trường hợp trung bình**: $O(N \log N)$ - cực kỳ nhanh, phân hoạch chia đôi mảng đều đặn.
- **Trường hợp xấu nhất**: $O(N^2)$ - xảy ra khi mảng đầu vào đã được sắp xếp sẵn và ta liên tục chọn phần tử đầu hoặc cuối làm Pivot. Để khắc phục, ta nên chọn Pivot ngẫu nhiên hoặc lấy trung vị của 3 phần tử.

Rèn luyện tư duy giải thuật tốt sẽ giúp bạn viết code ứng dụng thông minh hơn!`,
                author: user3._id,
                postType: 'advice',
                tags: ['machinelearning', 'python'],
                status: 'unresolved',
                viewCount: 1390,
                dailyViewCount: 16,
                dailyViewDate: new Date(),
                upvotes: [user1._id, user7._id, user8._id],
                downvotes: [],
                likes: [user1._id, user7._id],
                dislikes: [],
                images: ['https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop'],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            }
        ];

        // Seed 12 deleted posts for Admin Administrator to test pagination in Trash Page
        for (let i = 1; i <= 12; i++) {
            postsData.push({
                _id: new mongoose.Types.ObjectId(`6a364719a1b07db4bbeff90${i.toString(16)}`),
                title: `Bài viết đã xóa số ${i} - Thử nghiệm phân trang Thùng rác`,
                content: `Đây là nội dung của bài viết thử nghiệm số ${i} nhằm mục đích kiểm tra tính năng phân trang trong Thùng rác. Bài viết này đã bị xóa mềm và sẽ tự động dọn dẹp sau 7 ngày.`,
                author: admin1._id,
                postType: i % 2 === 0 ? 'question' : 'advice',
                tags: ['javascript', 'nodejs'],
                status: 'deleted',
                deletedBy: 'owner',
                deletedAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000),
                viewCount: 5 * i,
                upvotes: [],
                downvotes: [],
                likes: [],
                dislikes: [],
                createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
            });
        }

        const posts = await Post.insertMany(postsData);
        console.log(`Seeded ${posts.length} posts.`);

        const postMongoPagination = posts[0];
        const postCicd = posts[1];
        const postReactWindow = posts[2];
        const postNodeSingleThread = posts[3];

        // 5. Seed Comments & Nested Replies (35+ comments total across multiple posts)
        console.log('Seeding comments...');
        const commentDatas = [
            // Comments for MongoDB Pagination Post (postMongoPagination)
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a1'),
                content: 'Đối với việc phân trang lượng dữ liệu lớn như thế này, giải pháp tối ưu nhất chính là Keyset Pagination (hay còn gọi và Cursor-based pagination). Bạn sẽ dựa vào giá trị ID của bản ghi cuối cùng của trang trước đó làm điểm đánh dấu.',
                author: user3._id,
                post: postMongoPagination._id,
                parentComment: null,
                likes: [user2._id, user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a2'),
                content: 'Cảm ơn anh Cường! Nếu dùng Cursor-based thì làm thế nào để xử lý chức năng sắp xếp (Sort) theo các trường không phải là duy nhất như thời gian hay điểm số ạ? Vì giá trị có thể trùng nhau.',
                author: user2._id, // Tác giả bài viết hỏi lại
                post: postMongoPagination._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a1'),
                likes: [user3._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a3'),
                content: 'Để giải quyết việc trùng lặp, bạn có thể tạo một Cursor tổng hợp (Compound Cursor) kết hợp giữa trường sort chính (ví dụ: createdAt) và trường định danh duy nhất (_id) dạng: { createdAt_id }. Truy vấn lúc đó sẽ so sánh lớn hơn/nhỏ hơn cặp giá trị này.',
                author: user3._id, // Trả lời tiếp tục (Level 3)
                post: postMongoPagination._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a2'),
                likes: [user2._id, user8._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a4'),
                content: 'Đúng vậy, còn một lưu ý nữa là hãy đảm bảo trường dùng để filter làm cursor đã được tạo Index hợp lý trong MongoDB. Nếu không có index thì việc so sánh $gt hay $lt vẫn sẽ gây Full Table Scan làm chậm hệ thống.',
                author: user8._id,
                post: postMongoPagination._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a1'),
                likes: [user3._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a5'),
                content: 'Nếu dự án của bạn đòi hỏi bộ lọc phức tạp và phân trang ngẫu nhiên nhiều trang cuối, bạn nên cân nhắc đồng bộ dữ liệu sang Elasticsearch để thực hiện tìm kiếm và phân trang nhé. Elasticsearch xử lý vụ này tốt hơn MongoDB.',
                author: user13._id,
                post: postMongoPagination._id,
                parentComment: null,
                likes: [user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },

            // Comments for CI/CD Github Actions Post (postCicd)
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a6'),
                content: 'Bài viết chia sẻ rất chi tiết và thiết thực! Bạn cho mình hỏi là việc chạy SSH trực tiếp bằng action appleboy/ssh-action có thực sự an toàn về mặt bảo mật cho server VPS không?',
                author: user13._id,
                post: postCicd._id,
                parentComment: null,
                likes: [user8._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a7'),
                content: 'Chào bạn Phong, việc này khá an toàn nếu bạn sử dụng SSH Key và tạo tài khoản user deploy riêng có quyền hạn hạn chế trên VPS (thành viên thay vì dùng tài khoản root). Đồng thời hãy lưu SSH Key vào mục GitHub Secrets nhé.',
                author: user8._id, // Tác giả trả lời
                post: postCicd._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a6'),
                likes: [user13._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a8'),
                content: 'File YAML cấu hình rất sạch sẽ. Mình đã áp dụng và deploy thành công đồ án của mình lên Cloud trong vòng 3 phút! Cảm ơn anh Hải rất nhiều.',
                author: user11._id,
                post: postCicd._id,
                parentComment: null,
                likes: [user8._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },

            // Comments for React Window Post (postReactWindow)
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a9'),
                content: 'Một thư viện khác cũng rất đáng cân nhắc là react-virtuoso. Thư viện này hỗ trợ tự động tính toán kích thước chiều cao hàng (dynamic row height) cực kỳ tốt mà không cần cấu hình phức tạp như react-window.',
                author: user4._id,
                post: postReactWindow._id,
                parentComment: null,
                likes: [user1._id, user9._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8aa'),
                content: 'Đồng ý với Duy. Mình đã dùng thử react-virtuoso cho dự án chat realtime và thấy nó xử lý cuộn ngược (prepended items) rất mượt mà.',
                author: user1._id,
                post: postReactWindow._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8a9'),
                likes: [user4._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },

            // Comments for Node Single Thread (postNodeSingleThread)
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ab'),
                content: 'Đúng như bạn đoán, nếu bạn chạy tính năng tính toán quá nặng (ví dụ: băm mật khẩu hàng triệu lần, hay xử lý ảnh lớn) trực tiếp ở luồng chính, Event Loop sẽ bị nghẽn hoàn toàn, khiến mọi request khác từ client đều bị treo chờ đợi.',
                author: user13._id,
                post: postNodeSingleThread._id,
                parentComment: null,
                likes: [user3._id, user2._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ac'),
                content: 'Nhưng các tác vụ đọc ghi file hay truy vấn CSDL thì Node.js sẽ bàn giao cho Libuv Thread Pool xử lý bất đồng bộ ở background. Sau khi xử lý xong, Libuv sẽ gửi thông báo lại thông qua các Callback queue, do đó luồng chính không bị đứng hình.',
                author: user1._id,
                post: postNodeSingleThread._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ab'),
                likes: [user3._id, user13._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ad'),
                content: 'Cảm ơn giải thích rất trực quan từ hai anh. Vậy nếu em có bài toán bắt buộc phải xử lý CPU nặng trên NodeJS thì hướng giải quyết tối ưu là gì ạ?',
                author: user3._id, // Tác giả hỏi tiếp (Level 3)
                post: postNodeSingleThread._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ac'),
                likes: [user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ae'),
                content: 'Lúc đó bạn nên tách các tác vụ nặng đó ra chạy bằng Worker Threads (module tích hợp sẵn của Node) hoặc tạo ra các tiến trình phụ riêng bằng child_process để tận dụng nhiều nhân CPU.',
                author: user13._id, // Trả lời tiếp Level 4
                post: postNodeSingleThread._id,
                parentComment: new mongoose.Types.ObjectId('6a364719a1b07db4bbeff8ad'),
                likes: [user3._id, user1._id],
                dislikes: [],
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            }
        ];

        const comments = await Comment.insertMany(commentDatas);
        console.log(`Seeded ${comments.length} comments.`);

        // Cập nhật Accepted Answer cho bài viết đã được giải quyết
        // (Lấy bài viết MongoDB Pagination đổi trạng thái thành resolved và chọn Comment của user3 làm bestAnswer)
        const bestComment = comments.find(c => c._id.toString() === '6a364719a1b07db4bbeff8a1');
        if (bestComment) {
            await Post.findByIdAndUpdate(postMongoPagination._id, {
                $set: {
                    status: 'resolved',
                    bestAnswer: bestComment._id
                }
            });
            console.log('Set bestAnswer for MongoDB Pagination post and resolved it.');
        }

        // 6. Seed Report Tickets (8 reports to show rich flags table for admin)
        console.log('Seeding report tickets (flags)...');
        const reportTicketsData = [
            {
                post: posts[11]._id, // Lập trình Game bằng C++ (Post 12)
                reporter: user1._id,
                flagType: 'duplicate',
                details: 'Chủ đề này đã được thảo luận rất nhiều lần ở các bài viết trước. Đề nghị gộp bài.',
                status: 'submitted',
                outcome: 'pending',
                history: [
                    { status: 'submitted', note: 'Người dùng báo cáo trùng lặp chủ đề.', actorRole: 'user', actor: user1._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                post: posts[13]._id, // Hợp đồng thông minh (Post 14)
                reporter: user3._id,
                flagType: 'needs_detail',
                details: 'Thiếu thông tin về ngôn ngữ Solidity phiên bản nào và cụ thể lỗi gặp phải ở hàm nào.',
                status: 'received',
                outcome: 'pending',
                history: [
                    { status: 'submitted', note: 'Yêu cầu cung cấp thêm thông tin.', actorRole: 'user', actor: user3._id, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
                    { status: 'received', note: 'Hệ thống đã ghi nhận cờ.', actorRole: 'system', actor: null, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                post: posts[22]._id, // Hydration fail (Post 23)
                reporter: user2._id,
                flagType: 'spam',
                details: 'Tài khoản spam nội dung quảng cáo cờ bạc trá hình ở phần cuối nội dung.',
                status: 'action_taken',
                outcome: 'helpful',
                history: [
                    { status: 'submitted', note: 'Phát hiện spam link cá độ.', actorRole: 'user', actor: user2._id, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                    { status: 'in_review', note: 'Admin đang rà soát tài khoản người đăng.', actorRole: 'admin', actor: admin1._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                    { status: 'action_taken', note: 'Đã ẩn bài viết và cảnh cáo thành viên.', actorRole: 'admin', actor: admin1._id, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                comment: comments[10]._id, // Một bình luận thô tục / sai quy định (ví dụ comment ở Node Single thread)
                commentContentSnapshot: comments[10].content,
                reporter: user9._id,
                flagType: 'rude_abusive',
                details: 'Bình luận có ngôn từ xúc phạm và kích động bạo lực cá nhân.',
                status: 'closed',
                outcome: 'helpful',
                history: [
                    { status: 'submitted', note: 'Báo cáo từ thành viên về ngôn từ thô tục.', actorRole: 'user', actor: user9._id, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
                    { status: 'closed', note: 'Đã xóa bình luận vi phạm và trừ danh tiếng.', actorRole: 'admin', actor: admin2._id, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
                ],
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];
        await ReportTicket.insertMany(reportTicketsData);
        console.log('Report tickets seeded.');

        // 7. Seed Reputation History (40+ records for detailed charts on UI)
        console.log('Seeding reputation history...');
        const reputationHistoriesData = [];
        
        // Tạo lịch sử danh tiếng cho các user tiêu biểu (tích lũy điểm dần dần)
        const sampleVoters = [user1, user2, user3, user4, user5, user8, user13];
        
        // Phát sinh lịch sử cho user13 (Lý Hoàng Phong) - người có điểm cao
        for (let i = 0; i < 15; i++) {
            reputationHistoriesData.push({
                user: user13._id,
                type: 'post_upvoted',
                title: 'Bài viết nhận được Upvote từ thành viên diễn đàn',
                reputationEarned: 10,
                targetId: posts[9]._id, // TypeScript post
                voter: sampleVoters[i % sampleVoters.length]._id,
                createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000)
            });
        }

        // Phát sinh lịch sử cho user3 (Lê Hoàng Cường)
        for (let i = 0; i < 10; i++) {
            reputationHistoriesData.push({
                user: user3._id,
                type: 'post_upvoted',
                title: 'Bài viết được đánh giá hữu ích',
                reputationEarned: 10,
                targetId: posts[24]._id, // QuickSort post
                voter: sampleVoters[i % sampleVoters.length]._id,
                createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
            });
        }
        
        // Điểm thưởng khi được chọn Accepted Answer
        reputationHistoriesData.push({
            user: user3._id,
            type: 'accepted_answer',
            title: 'Bình luận được chọn làm Câu Trả Lời Tốt Nhất',
            reputationEarned: 15,
            targetId: postMongoPagination._id,
            voter: user2._id, // Tác giả bài viết
            createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
        });

        // Downvote phạt (trừ điểm)
        reputationHistoriesData.push({
            user: user4._id,
            type: 'post_downvoted',
            title: 'Bài viết bị Downvote do thiếu thông tin chi tiết',
            reputationEarned: -2,
            targetId: posts[22]._id,
            voter: user13._id,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        });

        // Điểm thưởng nhận được khi nhận Donation từ người dùng
        reputationHistoriesData.push({
            user: user13._id,
            type: 'donation_received',
            title: 'Nhận được điểm uy tín bổ sung từ giao dịch ủng hộ bài viết',
            reputationEarned: 20,
            targetId: posts[9]._id,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        });

        await ReputationHistory.insertMany(reputationHistoriesData);
        console.log(`Seeded ${reputationHistoriesData.length} reputation history records.`);

        // 8. Seed Donation Transactions (10 transactions)
        console.log('Seeding donation transactions...');
        const donationDatas = [
            {
                donor: user1._id,
                author: user13._id, // Nguyễn Văn An ủng hộ Lý Hoàng Phong
                post: posts[9]._id,
                amount: 50000,
                paymentMethod: 'cod',
                status: 'completed',
                note: 'Cảm ơn bài viết chia sẻ về TypeScript rất dễ hiểu và hữu ích!',
                donorSnapshot: { fullName: user1.fullName, avatar: user1.avatar, major: user1.major },
                authorSnapshot: { fullName: user13.fullName, avatar: user13.avatar, major: user13.major },
                postSnapshot: { title: posts[9].title },
                completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user2._id,
                author: user8._id, // Trần Thị Bình ủng hộ Đỗ Minh Hải
                post: posts[15]._id, // Docker Compose post
                amount: 100000,
                paymentMethod: 'vnpay',
                status: 'completed',
                note: 'Docker-compose rất chuẩn, mình đã chạy được môi trường test thành công.',
                donorSnapshot: { fullName: user2.fullName, avatar: user2.avatar, major: user2.major },
                authorSnapshot: { fullName: user8.fullName, avatar: user8.avatar, major: user8.major },
                postSnapshot: { title: posts[15].title },
                completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user3._id,
                author: user6._id, // Lê Hoàng Cường ủng hộ Vũ Thị Hương
                post: posts[4]._id, // Security post
                amount: 20000,
                paymentMethod: 'cod',
                status: 'completed',
                note: 'Tài liệu bảo mật rất hay nha bạn ơi!',
                donorSnapshot: { fullName: user3.fullName, avatar: user3.avatar, major: user3.major },
                authorSnapshot: { fullName: user6.fullName, avatar: user6.avatar, major: user6.major },
                postSnapshot: { title: posts[4].title },
                completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user4._id,
                author: user7._id, // Phạm Minh Duy ủng hộ Phạm Văn Giang
                post: posts[5]._id, // Machine Learning post
                amount: 50000,
                paymentMethod: 'vnpay',
                status: 'pending_review',
                note: 'Ủng hộ tác giả mua ly cà phê lấy cảm hứng viết tiếp lộ trình AI nhé!',
                donorSnapshot: { fullName: user4.fullName, avatar: user4.avatar, major: user4.major },
                authorSnapshot: { fullName: user7.fullName, avatar: user7.avatar, major: user7.major },
                postSnapshot: { title: posts[5].title },
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user5._id,
                author: user1._id, // Hoàng Đức Em ủng hộ Nguyễn Văn An
                post: posts[2]._id, // React Window post
                amount: 30000,
                paymentMethod: 'cod',
                status: 'completed',
                note: 'Thư viện rất tối ưu cho trang web của mình.',
                donorSnapshot: { fullName: user5.fullName, avatar: user5.avatar, major: user5.major },
                authorSnapshot: { fullName: user1.fullName, avatar: user1.avatar, major: user1.major },
                postSnapshot: { title: posts[2].title },
                completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user8._id,
                author: user12._id, // Đỗ Minh Hải ủng hộ Phùng Thị Oanh
                post: posts[18]._id, // Dark Mode tips post
                amount: 200000,
                paymentMethod: 'vnpay',
                status: 'completed',
                note: 'Các tips phối màu xám tối cực kỳ có giá trị!',
                donorSnapshot: { fullName: user8.fullName, avatar: user8.avatar, major: user8.major },
                authorSnapshot: { fullName: user12.fullName, avatar: user12.avatar, major: user12.major },
                postSnapshot: { title: posts[18].title },
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                donor: user9._id,
                author: user5._id, // Bùi Thị Kim ủng hộ Hoàng Đức Em
                post: posts[12]._id, // C# Web API structure post
                amount: 10000,
                paymentMethod: 'cod',
                status: 'rejected',
                note: 'Test giao dịch bị hủy bỏ.',
                donorSnapshot: { fullName: user9.fullName, avatar: user9.avatar, major: user9.major },
                authorSnapshot: { fullName: user5.fullName, avatar: user5.avatar, major: user5.major },
                postSnapshot: { title: posts[12].title },
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
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
