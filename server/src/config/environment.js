import 'dotenv/config'

const env = {
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/it_student_forum',

  // Server
  PORT: process.env.PORT || 5000,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'IT Forum <no-reply@yourdomain.com>',

  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Donation payment gateway (sandbox)
  VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE || '',
  VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET || '',
  VNPAY_URL: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/donate/result',

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_SAVED_TTL: process.env.REDIS_SAVED_TTL || '3600',
}

export default env
