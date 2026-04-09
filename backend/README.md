# Clinic Backend API

Backend API untuk aplikasi Clinic WebApp menggunakan Express.js, TypeScript, dan Prisma ORM.

## Prerequisites

- Node.js (v18 atau lebih tinggi)
- PostgreSQL (atau database yang didukung Prisma)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Salin `.env.example` ke `.env` dan update `DATABASE_URL`:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/clinic_db"
```

### 3. Run Prisma Migrations

```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server dengan auto-reload
- `npm run build` - Build TypeScript ke JavaScript
- `npm start` - Jalankan server production
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Jalankan database migrations
- `npm run prisma:studio` - Buka Prisma Studio untuk manage data
- `npm run prisma:seed` - Run seed scripts

## Project Structure

```
src/
├── index.ts           - Entry point aplikasi
├── lib/
│   └── prisma.ts      - Prisma client instance
├── routes/            - API route handlers
├── controllers/       - Business logic
├── middleware/        - Express middleware
└── services/          - Service layer

prisma/
├── schema.prisma      - Database schema
└── seed.ts           - Database seeding script
```

## API Endpoints

- `GET /api/health` - Health check endpoint

## Environment Variables

```env
DATABASE_URL=postgresql://...  # Database connection string
PORT=5000                      # Server port
NODE_ENV=development           # Environment (development, production)
```
