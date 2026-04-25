import rateLimit from 'express-rate-limit'

// Rate limiter for login endpoint - prevent brute force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi dalam 15 menit.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  handler: (req, res) => {
    res.status(429).json({
      message: 'Terlalu banyak percobaan login. Akun Anda mungkin sedang diserang. Coba lagi dalam 15 menit atau hubungi administrator.',
      retryAfter: Math.ceil(15 * 60), // seconds
    })
  },
})

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Terlalu banyak request dari IP ini. Coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Terlalu banyak request untuk operasi sensitif ini. Coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
})
