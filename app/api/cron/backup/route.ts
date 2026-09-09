import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { backupEmailHtml } from "@/lib/email-templates";
import { buildFullBackup } from "@/lib/backup";

/**
 * Dapatkan nomor minggu ISO-8601 dari sebuah tanggal (1-53). Dipakai buat
 * nentuin "minggu genap/ganjil" tanpa perlu nyimpen state kapan terakhir
 * backup jalan di database.
 */
function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Cron ini dijadwalkan jalan TIAP SENIN (lihat vercel.json), tapi cuma
 * benar-benar ngirim backup di minggu genap - efeknya jadi backup 2
 * mingguan tanpa perlu nyimpen "kapan terakhir kirim" di database.
 *
 * Tambahin ?force=1 di URL buat testing manual (skip pengecekan minggu genap).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const weekNumber = getIsoWeekNumber(new Date());
  const isBackupWeek = weekNumber % 2 === 0;

  if (!isBackupWeek && !force) {
    return NextResponse.json({
      skipped: true,
      reason: `Minggu ke-${weekNumber} adalah minggu ganjil, backup 2 mingguan cuma jalan di minggu genap.`,
    });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY belum di-set, backup tidak bisa dikirim lewat email." },
      { status: 503 }
    );
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];

  for (const u of users) {
    try {
      const backup = await buildFullBackup(u.id);
      const json = JSON.stringify(backup, null, 2);
      const filename = `backup-duwitku-${new Date().toISOString().slice(0, 10)}.json`;

      await resend.emails.send({
        from: EMAIL_FROM,
        to: u.email,
        subject: "Backup Data Duwitku Kamu (2 Mingguan)",
        html: backupEmailHtml(u.name, backup.generatedAt),
        attachments: [
          {
            filename,
            content: Buffer.from(json, "utf-8").toString("base64"),
          },
        ],
      });

      results.push({ email: u.email, status: "sent" });
    } catch (err) {
      console.error(`Gagal kirim backup ke ${u.email}:`, err);
      results.push({
        email: u.email,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    weekNumber,
    totalUsers: users.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
