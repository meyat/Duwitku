import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  code: z.string().length(6, "Kode harus 6 digit"),
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

    const { email, code, purpose } = parsed.data;
    const result = await verifyOtp(email, code, purpose);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Kode berhasil diverifikasi" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
