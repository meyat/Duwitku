import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { callAiChat, needsHeavyReasoning, resolveProvider, AiNotConfiguredError, type ChatMessage } from "@/lib/ai-client";
import { buildFinancialContext } from "@/lib/ai-financial-context";
import { checkAiRateLimit, getAiUsageToday } from "@/lib/ai-rate-limit";

const schema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong").max(2000, "Pesan terlalu panjang"),
});

const SYSTEM_PROMPT = `Kamu adalah asisten keuangan pribadi di aplikasi Duwitku. Nama kamu "Asisten Duwitku".

Tugas kamu:
- Bantu pengguna memahami kondisi keuangan mereka berdasarkan data yang diberikan.
- Kasih saran yang konkret dan actionable, bukan cuma teori umum.
- Kalau ditanya soal berapa yang bisa ditabung/dibelanjakan, HITUNG berdasarkan angka nyata yang diberikan (pemasukan, pengeluaran, target tabungan, utang), jangan cuma kasih rule umum tanpa perhitungan.
- Jawab dalam Bahasa Indonesia yang santai tapi jelas, tidak kaku.
- Jawaban ringkas, maksimal sekitar 200-300 kata kecuali diminta lebih detail.
- Kalau data tidak cukup untuk menjawab dengan pasti, bilang terus terang dan sebutkan asumsi yang kamu pakai.
- Kamu BUKAN penasihat investasi berlisensi - untuk keputusan investasi besar, ingatkan pengguna mempertimbangkan konsultasi profesional.
- Jangan mengarang data yang tidak ada di konteks yang diberikan.

Berikut data keuangan pengguna saat ini:
{{CONTEXT}}`;

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const messages = await prisma.aiChatMessage.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const usage = await getAiUsageToday(user!.id);

  return NextResponse.json({ messages, usage });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const allowed = await checkAiRateLimit(userId);
    if (!allowed) {
      const usage = await getAiUsageToday(userId);
      return NextResponse.json(
        {
          error: `Kamu sudah mencapai batas ${usage.limit} pesan AI hari ini. Coba lagi besok.`,
          usage,
        },
        { status: 429 }
      );
    }

    // Simpan pesan user dulu
    await prisma.aiChatMessage.create({
      data: { userId, role: "user", content: parsed.data.message },
    });

    // Ambil riwayat percakapan terakhir (max 10 pesan) buat konteks
    const recentMessages = await prisma.aiChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const history: ChatMessage[] = recentMessages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const financialContext = await buildFinancialContext(userId);
    const systemPrompt = SYSTEM_PROMPT.replace("{{CONTEXT}}", financialContext);

    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { aiProvider: true } });
    const provider = resolveProvider(dbUser?.aiProvider);
    const useHeavyModel = needsHeavyReasoning(parsed.data.message);
    const reply = await callAiChat(
      [{ role: "system", content: systemPrompt }, ...history],
      useHeavyModel,
      provider
    );

    await prisma.aiChatMessage.create({
      data: { userId, role: "assistant", content: reply },
    });

    const usage = await getAiUsageToday(userId);

    return NextResponse.json({ reply, usage });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        {
          error:
            "Fitur AI belum dikonfigurasi dengan benar (kedua provider gagal). Hubungi admin aplikasi untuk mengaktifkan fitur ini.",
        },
        { status: 503 }
      );
    }
    console.error("AI chat error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan saat menghubungi AI. Coba lagi sebentar." }, { status: 500 });
  }
}

export async function DELETE() {
  const { user, error } = await requireUser();
  if (error) return error;

  await prisma.aiChatMessage.deleteMany({ where: { userId: user!.id } });

  return NextResponse.json({ message: "Riwayat chat dihapus" });
}
