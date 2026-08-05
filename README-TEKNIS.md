# Personal Finance Tracker — Dokumentasi Teknis

Dokumen ini untuk developer yang ingin menjalankan atau mengembangkan project ini lewat terminal/CLI. Kalau kamu bukan programmer, lihat [`README.md`](./README.md) dan [`TUTORIAL-DEPLOY.md`](./TUTORIAL-DEPLOY.md) sebagai gantinya.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- [NextAuth v5](https://authjs.dev/) (Credentials provider)
- [Recharts](https://recharts.org/) untuk grafik
- [Zod](https://zod.dev/) untuk validasi
- [Lucide React](https://lucide.dev/) untuk ikon
- [Sonner](https://sonner.emilkowal.ski/) untuk toast notification
- [Papaparse](https://www.papaparse.com/) + [SheetJS](https://sheetjs.com/) untuk import/export CSV/Excel
- [Vitest](https://vitest.dev/) untuk unit testing

## Fitur

Autentikasi lengkap · Dashboard ringkasan · CRUD transaksi + kategori + tag · Riwayat dengan filter/search/sort/pagination · Global Search (Cmd/Ctrl+K) · Statistik & grafik (pie/bar chart) · Target Tabungan · Tagihan + reminder · Transaksi Berulang (auto-generate) · Utang/Piutang dengan cicilan otomatis & manual · Investasi sederhana · Import CSV (preview + validasi + deteksi duplikat) · Export CSV/Excel · Notification Center · PWA (installable, offline page, service worker) · Dark theme default.

## Instalasi Lokal

```bash
npm install
cp .env.example .env   # isi DATABASE_URL & NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed        # opsional, data demo
npm run dev
```

Buka http://localhost:3000

> ⚠️ **Catatan Prisma 7**: project ini pakai Prisma versi 7, yang mewajibkan driver
> adapter (`@prisma/adapter-pg`) untuk semua koneksi database — tidak ada lagi query
> engine bawaan. Konfigurasi datasource ada di `prisma.config.ts` (bukan lagi
> `url` di dalam `schema.prisma`). Semua ini sudah dikonfigurasi di project ini,
> kamu tidak perlu ubah apa-apa kecuali mengganti `DATABASE_URL` di `.env`.

## Environment Variables

| Variable | Deskripsi |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL — pakai **Transaction Pooler** (port 6543) untuk Supabase, dipakai aplikasi saat runtime |
| `DIRECT_URL` | Connection string PostgreSQL **langsung** (port 5432, bukan pooler) — wajib untuk `prisma db push`/`migrate`. Kalau ini pakai pooler, proses push bisa hang tanpa error jelas |
| `NEXTAUTH_URL` | URL aplikasi (untuk NextAuth callback) |
| `NEXTAUTH_SECRET` | Secret untuk enkripsi session/JWT — generate dengan `openssl rand -base64 32` |
| `SEED_SECRET` | (Opsional) Proteksi endpoint `/api/dev-seed` untuk seeding tanpa CLI |

## Script Tersedia

```bash
npm run dev          # jalankan development server
npm run build         # build production (otomatis prisma generate + db push)
npm run start          # jalankan production server
npm run lint            # jalankan ESLint
npm run test             # jalankan unit test (vitest)
npm run db:push          # sinkronkan schema ke database tanpa migration history
npm run db:migrate        # buat migration baru (development)
npm run db:seed            # isi data demo
npm run db:studio           # buka Prisma Studio (GUI database)
```

## Struktur Folder

```
app/
  (auth)/              # Halaman login, register, forgot password
  (dashboard)/         # Halaman utama setelah login (sidebar + bottom nav)
  api/                 # API routes (REST, per-resource)
components/
  ui/                  # Komponen dasar (Button, Input, Card, dst)
  layout/              # Sidebar, Topbar, BottomNav, GlobalSearch
  charts/              # Pie chart & bar chart
  debts/               # Komponen modul utang/piutang
  import/              # Komponen import CSV
lib/
  auth.ts              # Konfigurasi NextAuth
  prisma.ts            # Prisma client singleton
  validations*.ts       # Zod schema per domain
  utils.ts              # Format currency, tanggal, kalkulasi cicilan
  debt-utils.ts          # Recalculate status utang/piutang
  notification-utils.ts   # Generate notifikasi otomatis
  seed-data.ts              # Logic seeding (dipakai CLI & API route)
  hooks/                     # Custom React hooks untuk fetch data
prisma/
  schema.prisma        # Skema database lengkap (15+ model)
  seed.ts               # Entry point CLI seeding
tests/
  *.test.ts             # Unit test kalkulasi inti
```

## Deploy Otomatis (Vercel)

Build script (`package.json`) sudah dikonfigurasi menjalankan `prisma generate && prisma db push --accept-data-loss && next build`, sehingga schema database otomatis tersinkron setiap deploy tanpa perlu menjalankan migration manual. Cocok untuk platform serverless seperti Vercel.

Endpoint `/api/dev-seed?secret=<SEED_SECRET>` tersedia untuk trigger seeding lewat browser di lingkungan yang tidak punya akses terminal (misalnya Vercel preview). Hapus/ubah `SEED_SECRET` setelah dipakai.

## Catatan Implementasi

- Semua endpoint API memvalidasi kepemilikan data (`userId`) — user hanya bisa mengakses datanya sendiri.
- Password di-hash dengan bcrypt (12 rounds).
- Soft delete diterapkan pada Transaction, Category, SavingGoal, Bill, Debt, Investment (kolom `deletedAt`).
- Cicilan otomatis: selisih pembulatan dimasukkan ke cicilan terakhir agar total tetap sama dengan total nominal (lihat `calculateAutomaticInstallments` di `lib/utils.ts`).
- Status utang/piutang di-recalculate otomatis setiap ada perubahan pembayaran (lihat `lib/debt-utils.ts`).
- Rate limiting belum diimplementasikan di level aplikasi — pertimbangkan menambah middleware rate limit untuk endpoint sensitif (login, register) jika akan digunakan publik.

## Lisensi

MIT
