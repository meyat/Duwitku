import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hasRecentVerifiedOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
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

    const email = parsed.data.email.toLowerCase();

    const isVerified = await hasRecentVerifiedOtp(email, "RESET_PASSWORD");
    if (!isVerified) {
      return NextResponse.json(
        { error: "Email belum diverifikasi dengan kode OTP. Silakan verifikasi ulang." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
