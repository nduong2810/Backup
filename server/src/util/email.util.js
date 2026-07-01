import env from '../config/environment.js';

const sendEmail = async (to, subject, text) => {
    // Nếu chưa cấu hình Resend API Key, hệ thống sẽ log ra để phục vụ việc test cục bộ
    if (!env.RESEND_API_KEY) {
        console.log(`\n=================== [RESEND EMAIL SKIPPED] ===================`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${text}`);
        console.log(`==============================================================\n`);
        return true;
    }

    try {
        // Gửi email qua HTTPS API (cổng 443 luôn mở trên Render)
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: env.EMAIL_FROM,
                to: [to],
                subject: subject,
                text: text
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`Email sent successfully via Resend API to: ${to} (ID: ${data.id})`);
        } else {
            console.error('Resend API error response:', data);
        }
    } catch (error) {
        console.error("Failed to send email via Resend API:", error.message || error);
    }

    // Luôn trả về true để không bao giờ làm nghẽn tiến trình đăng ký/đổi mật khẩu
    return true;
};

export default sendEmail;