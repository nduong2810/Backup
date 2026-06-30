import nodemailer from 'nodemailer';
import env from '../config/environment.js';

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: env.EMAIL_HOST,
            port: env.EMAIL_PORT,
            secure: env.EMAIL_PORT === 465, // True nếu port 465, False nếu port 587
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS
            }
        });

        // Gửi mail chạy ngầm (không dùng await) để tránh treo HTTP request của client
        transporter.sendMail({
            from: `"IT Forum Support" <${env.EMAIL_USER}>`,
            to,
            subject,
            text
        }).then(() => {
            console.log("Email sent successfully to:", to);
        }).catch((error) => {
            console.error("Email sending background failed:", error.message || error);
        });
    } catch (error) {
        console.error("Failed to initialize transporter:", error.message || error);
    }

    // Trả về true ngay lập tức để không chặn tiến trình đăng ký/giao dịch
    return true;
};

export default sendEmail;