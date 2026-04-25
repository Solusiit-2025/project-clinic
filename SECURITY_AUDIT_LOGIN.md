# 🔒 Audit Keamanan Login - Klinik Yasfina

**Tanggal Audit:** 25 April 2026  
**Auditor:** AI Security Review  
**Scope:** Authentication & Authorization System

---

## ✅ Yang Sudah Aman

### 1. **Password Hashing** ✓
- ✅ Menggunakan `bcrypt` untuk hashing password
- ✅ Password tidak pernah disimpan dalam plaintext
- ✅ Password tidak dikembalikan dalam response API
- ✅ Menggunakan `bcrypt.compare()` untuk verifikasi

### 2. **JWT Token — HttpOnly Cookie** ✓ *(UPGRADED)*
- ✅ Token disimpan di **HttpOnly Cookie** — tidak bisa diakses JavaScript
- ✅ Cookie `Secure` flag aktif di production (HTTPS only)
- ✅ Cookie `SameSite=Lax` — proteksi CSRF
- ✅ Token expiry 1 hari
- ✅ Token di-verify setiap request via middleware
- ✅ Cookie otomatis dihapus saat logout (`/api/auth/logout`)
- ✅ Cookie otomatis dihapus jika token invalid/expired

### 3. **CORS Configured** ✓ *(UPGRADED)*
- ✅ `credentials: true` untuk cookie cross-origin
- ✅ Origin whitelist (bukan `*`)
- ✅ Allowed headers terdefinisi

### 4. **Rate Limiting** ✓ *(NEW)*
- ✅ 5 attempts per 15 menit per IP
- ✅ `skipSuccessfulRequests: true`

### 5. **JWT_SECRET** ✓ *(UPGRADED)*
- ✅ 128-character random secret
- ✅ Server crash jika tidak di-set (tidak ada fallback)

### 6. **Error Messages Generic** ✓ *(UPGRADED)*
- ✅ "Email atau password salah" — tidak reveal apakah email terdaftar

### 3. **Input Validation** ✓
- ✅ Email dan password required di controller
- ✅ Email format validation di frontend (type="email")
- ✅ Prisma ORM mencegah SQL injection

**Lokasi:** `backend/src/controllers/auth.controller.ts`, `frontend/app/login/page.tsx`

### 4. **Role-Based Access Control (RBAC)** ✓
- ✅ Role middleware untuk proteksi endpoint
- ✅ Redirect otomatis berdasarkan role (DOCTOR → /doctor, ADMIN → /admin)
- ✅ Verifikasi role di setiap protected route

**Lokasi:** `backend/src/middleware/auth.middleware.ts`

### 5. **Multi-Clinic Authorization** ✓
- ✅ User hanya bisa akses clinic yang di-assign
- ✅ Validasi `x-clinic-id` header di middleware
- ✅ Fallback ke clinic pertama jika header tidak valid

**Lokasi:** `backend/src/middleware/auth.middleware.ts`

### 6. **Account Status Check** ✓
- ✅ Cek `isActive` sebelum login
- ✅ Cek `isActive` di setiap request (middleware)
- ✅ Error message jelas untuk akun non-aktif

---

## ⚠️ Kerentanan Kritis yang Harus Diperbaiki

### 1. **JWT_SECRET Hardcoded** 🔴 CRITICAL
**Masalah:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'clinic-secret-key-2026'
```
- Secret key hardcoded sebagai fallback
- Secret key terlalu lemah dan predictable
- Tidak ada di `.env.example`

**Dampak:**
- Attacker bisa generate token palsu jika mengetahui secret
- Semua token bisa di-decode

**Fix:**
```typescript
// backend/src/services/auth.service.ts & auth.middleware.ts
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables')
}
```

```bash
# backend/.env.example
JWT_SECRET="your-super-secret-key-min-32-characters-random-string"
```

**Generate strong secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 2. **Tidak Ada Rate Limiting pada Login** 🔴 CRITICAL
**Masalah:**
- Tidak ada proteksi brute force attack
- Attacker bisa mencoba unlimited password combinations
- Rate limiter hanya ada di public routes, tidak di `/api/auth/login`

**Dampak:**
- Brute force attack bisa berhasil
- Account takeover risk tinggi
- Server bisa overload dari automated attacks

**Fix:**
Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
})

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Terlalu banyak request. Coba lagi nanti.',
})
```

```typescript
// backend/src/routes/auth.routes.ts
import { loginLimiter } from '../middleware/rateLimiter'

router.post('/login', loginLimiter, AuthController.login)
```

---

### 3. **Tidak Ada Account Lockout** 🟠 HIGH
**Masalah:**
- Tidak ada mekanisme lockout setelah failed attempts
- User bisa di-brute force tanpa batas

**Fix:**
Tambahkan field di User model:
```prisma
model User {
  // ... existing fields
  loginAttempts    Int       @default(0)
  lockedUntil      DateTime?
}
```

```typescript
// backend/src/services/auth.service.ts
static async login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) {
    throw new Error('User tidak ditemukan')
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw new Error(`Akun terkunci. Coba lagi dalam ${minutesLeft} menit.`)
  }

  if (!user.isActive) {
    throw new Error('Akun Anda dinonaktifkan')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    // Increment failed attempts
    const attempts = user.loginAttempts + 1
    const updateData: any = { loginAttempts: attempts }
    
    // Lock account after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })
    
    throw new Error(`Password salah. ${5 - attempts} percobaan tersisa.`)
  }

  // Reset login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    },
  })

  // ... rest of login logic
}
```

---

### 4. **Tidak Ada CSRF Protection** 🟠 HIGH
**Masalah:**
- API tidak menggunakan CSRF token
- Vulnerable to Cross-Site Request Forgery

**Catatan:**
Untuk SPA dengan JWT di localStorage, CSRF risk lebih rendah karena:
- Token tidak auto-sent seperti cookies
- Same-origin policy melindungi localStorage

**Namun tetap recommended:**
```typescript
// backend/src/index.ts
import cors from 'cors'

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clinic-id'],
}))
```

---

### 5. **Tidak Ada Session Management** 🟡 MEDIUM
**Masalah:**
- Tidak ada mekanisme untuk revoke token
- User tidak bisa logout dari semua device
- Tidak ada session tracking

**Fix:**
Implementasi token blacklist atau refresh token:
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 6. **Error Messages Terlalu Spesifik** 🟡 MEDIUM
**Masalah:**
```typescript
if (!user) {
  throw new Error('User tidak ditemukan') // ❌ Reveals email exists
}
if (!isPasswordValid) {
  throw new Error('Password salah') // ❌ Confirms email is valid
}
```

**Dampak:**
- Attacker bisa enumerate valid emails
- Information disclosure

**Fix:**
```typescript
if (!user || !isPasswordValid) {
  throw new Error('Email atau password salah') // ✅ Generic message
}
```

---

### 7. **Tidak Ada Audit Logging** 🟡 MEDIUM
**Masalah:**
- Tidak ada log untuk login attempts
- Tidak ada log untuk failed logins
- Sulit detect suspicious activity

**Fix:**
```typescript
// Log every login attempt
await prisma.activityLog.create({
  data: {
    userId: user?.id || null,
    action: isPasswordValid ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    module: 'AUTH',
    description: `Login attempt for ${email}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }
})
```

---

### 8. **Password Policy Lemah** 🟡 MEDIUM
**Masalah:**
- Tidak ada minimum password length
- Tidak ada complexity requirements
- Tidak ada password strength indicator

**Fix:**
```typescript
// backend/src/services/auth.service.ts
static validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password minimal 8 karakter' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf besar' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf kecil' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung angka' }
  }
  return { valid: true }
}
```

---

### 9. **XSS Vulnerability di Frontend** 🟢 LOW
**Status:** React secara default escape HTML, tapi tetap perlu waspada

**Best Practice:**
- ✅ Gunakan `dangerouslySetInnerHTML` hanya jika benar-benar perlu
- ✅ Sanitize user input sebelum render
- ✅ Gunakan Content Security Policy (CSP)

---

### 10. **Tidak Ada 2FA/MFA** 🟢 LOW (Nice to Have)
**Rekomendasi:**
- Implementasi TOTP (Google Authenticator)
- SMS OTP untuk high-privilege accounts
- Email verification untuk login dari device baru

---

## 📋 Priority Fix Checklist

### 🔴 CRITICAL (Fix Immediately)
- [ ] Generate dan set strong JWT_SECRET di production
- [ ] Implementasi rate limiting pada login endpoint
- [ ] Hapus hardcoded JWT_SECRET fallback

### 🟠 HIGH (Fix This Week)
- [ ] Implementasi account lockout mechanism
- [ ] Generic error messages untuk login
- [ ] CORS configuration yang proper

### 🟡 MEDIUM (Fix This Month)
- [ ] Password policy enforcement
- [ ] Audit logging untuk security events
- [ ] Session management dengan refresh tokens

### 🟢 LOW (Future Enhancement)
- [ ] 2FA/MFA implementation
- [ ] Password strength indicator
- [ ] Suspicious login detection

---

## 🛡️ Security Headers yang Harus Ditambahkan

```typescript
// backend/src/index.ts
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))
```

---

## 📊 Security Score

**Current Score: 6.5/10**

| Category | Score | Status |
|----------|-------|--------|
| Password Security | 8/10 | ✅ Good |
| Token Management | 7/10 | ⚠️ Needs JWT_SECRET fix |
| Rate Limiting | 2/10 | 🔴 Critical |
| Session Management | 4/10 | 🟠 Needs improvement |
| Error Handling | 5/10 | 🟡 Too verbose |
| Audit Logging | 3/10 | 🟡 Missing |
| Input Validation | 8/10 | ✅ Good |
| Authorization | 9/10 | ✅ Excellent |

**Target Score: 9/10** (after implementing all HIGH priority fixes)

---

## 🎯 Kesimpulan

Sistem login **sudah cukup aman untuk development**, tapi **TIDAK SIAP untuk production** tanpa fix untuk:
1. JWT_SECRET yang proper
2. Rate limiting
3. Account lockout

Setelah 3 fix critical di atas, sistem akan **production-ready** dengan security level yang baik.

---

**Next Steps:**
1. Implementasi 3 critical fixes
2. Test dengan penetration testing tools (OWASP ZAP, Burp Suite)
3. Security code review berkala
4. Monitor failed login attempts di production
