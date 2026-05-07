import env from './environment'

const corsOptions = {
  origin: env.CLIENT_URL, // Chỉ cho phép frontend truy cập
  credentials: true,       // Cho phép gửi cookies (HttpOnly JWT)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export default corsOptions
