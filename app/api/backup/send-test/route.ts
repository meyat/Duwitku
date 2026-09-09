import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { backupEmailHtml } from "@/lib/email-templates";
import { buildFullBackup } from "@/lib/backup";

/**
 * Endpoint buat testing manual dari Settings - kirim backup ke email user
 * yang lagi login SEKARANG JUGA, tanpa nunggu jadwal cron 2 mingguan.
 * Dilindungi session login biasa (requireUser), bukan CRON_SECRET.
 */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY belum di-set, backup tidak bisa dikirim lewat email." },
      { status: 503 }
    );
  }

  try {
    const backup = await buildFullBackup(user!.id);
    const json = JSON.stringify(backup, null, 2);
    const filename = `backup-duwitku-${new Date().toISOString().slice(0, 10)}.json`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: user!.email!,
      subject: "Backup Data Duwitku Kamu (Tes Manual)",
      html: backupEmailHtml(user!.name ?? "User", backup.generatedAt),
      attachments: [
        {
          filename,
          content: Buffer.from(json, "utf-8").toString("base64"),
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gagal kirim backup tes:", err);
    return NextResponse.json({ error: "Gagal mengirim email backup." }, { status: 500 });
  }
}
