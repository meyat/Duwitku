import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI (generate/db push/migrate) butuh koneksi LANGSUNG ke database
// (port 5432), bukan lewat transaction pooler Supabase (port 6543) — pooler
// itu gak support operasi bikin/ubah tabel dengan baik dan bikin proses jadi
// hang/stuck. Aplikasi runtime (lib/prisma.ts) tetap pakai DATABASE_URL
// (pooler) karena itu yang direkomendasikan buat serverless.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
