import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, createAndSendOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu balas sukses walau user tidak ditemukan, agar tidak bocorkan data akun
    if (user) {
      const allowed = await checkRateLimit(email, "RESET_PASSWORD");
      if (allowed) {
        await createAndSendOtp(email, "RESET_PASSWORD");
      }
    }

    return NextResponse.json({
      message: "Kalau email terdaftar, kode OTP reset password sudah dikirim",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
