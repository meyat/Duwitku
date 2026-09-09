# Duwitku — Dokumentasi Teknis

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

## Sistem Tema (Light/Dark Mode)

Tema dikelola oleh `components/theme-provider.tsx` (React context) + `components/theme-init-script.tsx`
(inline script anti-flicker yang jalan sebelum hydration). Preferensi disimpan di `localStorage`
(sumber utama, langsung diterapkan) dan juga di-sync ke database lewat `/api/settings/preferences`
(untuk referensi lintas device). Class `dark`/`light` diterapkan ke elemen `<html>`, bukan lagi
di-hardcode di `app/layout.tsx`.

Semua warna "tint"/transparan (background badge, status card, dll) memakai token eksplisit
(`--danger-soft`, `--success-soft`, `--warning-soft`, `--primary-soft`) di `globals.css`, BUKAN
utility Tailwind `bg-warna/NN`. Ini disengaja — Tailwind v4 tidak konsisten menerapkan opacity
modifier pada custom property yang di-define lewat `@theme inline`, sehingga class seperti
`bg-danger/10` bisa render sebagai warna solid 100% alih-alih transparan 10%. Kalau menambah
warna tint baru, tambahkan token `-soft` baru di `globals.css`, jangan pakai `/NN`.

## Sistem Autentikasi (OTP Email)

Pendaftaran akun dan lupa password tidak lagi pakai kode undangan atau link token —
sekarang pakai kode OTP 6 digit yang dikirim ke email lewat Resend.

Alur: `POST /api/auth/send-otp` (kirim kode) → `POST /api/auth/verify-otp` (verifikasi) →
`POST /api/register` atau `POST /api/reset-password` (finalisasi, hanya berhasil kalau
email tersebut baru saja lolos verifikasi OTP dalam 30 menit terakhir — dicek lewat
`hasRecentVerifiedOtp()` di `lib/otp.ts`).

Rate limit: maksimal 3 kali kirim OTP per email per jam (`checkRateLimit()` di `lib/otp.ts`),
dan maksimal 5 kali percobaan kode salah sebelum kode itu dianggap invalid. Ini mencegah
penyalahgunaan/biaya kirim email membengkak.

Kalau `RESEND_API_KEY` belum di-set (misal saat development lokal), kode OTP otomatis
di-log ke console server alih-alih benar-benar dikirim email — cek terminal `npm run dev`
untuk lihat kodenya.

## Asisten AI Analisis Keuangan

Widget chat floating (pojok kanan bawah) yang bisa diakses dari semua halaman dashboard.
Backend mengumpulkan konteks keuangan user (saldo, pemasukan/pengeluaran bulanan, kategori
terbesar, wallet, target tabungan, utang/piutang, investasi — lihat `lib/ai-financial-context.ts`)
dan mengirimkannya sebagai system prompt ke AI provider, sehingga jawaban AI selalu berbasis
data nyata pengguna, bukan generik.

Riwayat chat disimpan permanen per user (tabel `ai_chat_messages`), dan rate limit harian
dicek lewat `lib/ai-rate-limit.ts` (default 20 pesan/hari/user, bisa diubah lewat
`AI_DAILY_LIMIT`). Kalau `AI_API_KEY` belum di-set, endpoint akan balas error yang jelas
("Fitur AI belum dikonfigurasi") alih-alih crash.

Provider AI menggunakan format OpenAI Chat Completions API standar (`lib/ai-client.ts`),
jadi kompatibel dengan Kenari.id, Sumopod, atau provider OpenAI-compatible lain — tinggal
ganti `AI_BASE_URL` dan `AI_MODEL`.

## Grup Sharing (Berbagi Data Keuangan)

User bisa bikin grup (maksimal 5 anggota termasuk pemilik) dan mengundang orang lain lewat
email (orang tersebut wajib sudah punya akun Duwitku). Undangan butuh konfirmasi dari
penerima (accept/decline) sebelum dianggap anggota aktif — lihat `lib/group-utils.ts` dan
route di `app/api/groups/`.

Halaman detail grup (`/groups/[id]`) menampilkan data **agregat** dari transaksi semua
anggota yang berstatus ACCEPTED (total saldo, pemasukan/pengeluaran bulan ini, transaksi
terbaru) — bukan menggabungkan data mentah, tapi query on-the-fly berdasarkan daftar
`userId` anggota. Setiap anggota tetap punya wallet/transaksi masing-masing secara privat;
yang di-share hanya ringkasan angka dan transaksi individual (judul, nominal, siapa yang
input) saat dilihat dari halaman grup.

**Target Tabungan Bersama** (`GroupSavingGoal`) terpisah dari target tabungan pribadi biasa
— kontribusi dicatat per anggota (`GroupSavingContribution`), status otomatis jadi
`ACHIEVED` kalau total kontribusi >= target.

**Chat Grup** (`/groups/[id]/chat`) pakai polling ringan tiap 5 detik (bukan WebSocket,
supaya tetap kompatibel dengan hosting serverless seperti Vercel tanpa infra tambahan).

**Auto-refresh**: `lib/hooks/use-refetch-on-focus.ts` dipakai di Dashboard dan halaman Grup
untuk otomatis fetch ulang data setiap kali tab/PWA kembali fokus (event `visibilitychange`
dan `focus`), jadi data selalu fresh tanpa perlu refresh manual.

## Multi Bahasa (i18n)

Sistem bahasa custom (bukan next-intl/URL-based routing) di `lib/i18n/` — pilihan ini
supaya switching bahasa bisa **live tanpa reload** dan tanpa perlu restrukturisasi semua
route ke `[locale]/...`. Dictionary ada di `lib/i18n/translations.ts` (flat key per locale:
`en`, `id`, `zh`, `ko`, `ja`), diakses lewat hook `useLanguage()` dari
`lib/i18n/language-provider.tsx` yang expose `t(key, vars?)`.

Preferensi bahasa disimpan di `localStorage` (instant apply) dan disinkron ke kolom
`user.language` di database lewat `/api/settings/preferences` (biar konsisten lintas
device). Ganti bahasa lewat dropdown `<LanguageSwitcher />` — ada di halaman auth (pojok
kanan atas) dan Pengaturan.

**Cakupan saat ini**: Sidebar, Bottom Nav, Topbar, Dashboard, halaman Login/Register/Lupa
Password (termasuk seluruh alur OTP), dan Pengaturan — semua penuh 5 bahasa. Halaman
lain (Transaksi, Tagihan, Wallet, Utang/Piutang, Investasi, Grup Sharing, dll) masih
Bahasa Indonesia hardcoded; kalau mau ditambah, ikuti pola yang sama: tambah key baru di
`translations.ts` untuk 5 bahasa, lalu `const { t } = useLanguage();` di komponennya dan
ganti string literal jadi `t("namespace.key")`.

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
| `RESEND_API_KEY` | API key dari [resend.com](https://resend.com) untuk mengirim email kode OTP (verifikasi daftar & lupa password) |
| `RESEND_FROM_EMAIL` | Alamat pengirim email, format `"Nama <email@domain.com>"`. Tanpa domain terverifikasi, pakai `onboarding@resend.dev` (hanya bisa kirim ke email akun Resend sendiri) |
| `AI_API_KEY` | API key dari [Kenari.id](https://kenari.id) atau Sumopod untuk fitur Asisten AI. Kosongkan kalau belum mau pakai fitur ini (chat AI otomatis nonaktif dengan pesan yang jelas) |
| `AI_BASE_URL` | Base URL provider AI, default `https://kenari.id/v1` (OpenAI-compatible). Ganti sesuai provider yang dipakai |
| `AI_MODEL` | Model yang dipakai, default `deepseek-v4-flash`. Cek `/v1/models` provider untuk daftar model id yang valid |
| `AI_DAILY_LIMIT` | Batas maksimal pesan AI per user per hari, default `20`, biar biaya API tidak jebol |

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
