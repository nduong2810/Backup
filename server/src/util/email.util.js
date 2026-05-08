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

        await transporter.sendMail({
            from: `"IT Forum Support" <${env.EMAIL_USER}>`,
            to,
            subject,
            text
        });
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Không thể gửi email lúc này");
    }
};

export default sendEmail;