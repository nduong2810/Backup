import env from './environment'

const getOriginFromUrl = (value) => {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch (error) {
    return null
  }
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  getOriginFromUrl(env.CLIENT_URL),
  getOriginFromUrl(env.VNPAY_RETURN_URL),
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export default corsOptions
