import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDemoData } from "@/lib/seed-data";

/**
 * Endpoint ini sengaja bisa dipanggil dari browser (bukan cuma terminal),
 * supaya orang yang deploy tanpa akses terminal tetap bisa isi data demo.
 *
 * Dilindungi oleh SEED_SECRET di environment variable, wajib cocok lewat
 * query string ?secret=... agar tidak sembarang orang bisa trigger.
 *
 * Setelah dipakai, sebaiknya hapus/ubah SEED_SECRET di Vercel agar endpoint
 * ini tidak bisa dipanggil ulang oleh orang lain.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.SEED_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "SEED_SECRET belum di-set di environment variable" },
      { status: 500 }
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ error: "Secret tidak cocok" }, { status: 401 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: "demo@financetracker.com" } });
    if (existing) {
      return NextResponse.json({
        message: "Data demo sudah pernah dibuat sebelumnya",
        email: "demo@financetracker.com",
      });
    }

    const result = await seedDemoData(prisma);
    return NextResponse.json({
      message: "Data demo berhasil dibuat! Silakan login dengan kredensial berikut.",
      ...result,
    });
  } catch (err) {
    console.error("Dev seed error:", err);
    return NextResponse.json({ error: "Gagal membuat data demo" }, { status: 500 });
  }
}
