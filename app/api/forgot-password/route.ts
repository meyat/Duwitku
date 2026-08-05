import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu balas sukses walau user tidak ditemukan, agar tidak bocorkan data akun
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 menit

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      // TODO: kirim email berisi link reset ke user.email
      // link: `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
      console.log(`[DEV] Password reset token untuk ${email}: ${token}`);
    }

    return NextResponse.json({
      message: "Jika email terdaftar, instruksi reset password sudah dikirim",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
