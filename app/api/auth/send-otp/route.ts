import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, createAndSendOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  purpose: z.enum(["REGISTER", "RESET_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const { email, purpose } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (purpose === "REGISTER" && existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    if (purpose === "RESET_PASSWORD" && !existingUser) {
      // Jangan bocorkan apakah email terdaftar atau tidak - selalu balas sukses
      return NextResponse.json({ message: "Kalau email terdaftar, kode OTP sudah dikirim" });
    }

    const allowed = await checkRateLimit(normalizedEmail, purpose);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan kode. Coba lagi dalam 1 jam." },
        { status: 429 }
      );
    }

    await createAndSendOtp(normalizedEmail, purpose);

    return NextResponse.json({ message: "Kode OTP sudah dikirim ke email kamu" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
