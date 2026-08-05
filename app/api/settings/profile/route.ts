import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user!.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      currency: true,
      dateFormat: true,
      timezone: true,
      language: true,
      theme: true,
      weekStartsOn: true,
    },
  });

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();

    if (body.currentPassword && body.newPassword) {
      const parsed = passwordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
          { status: 400 }
        );
      }

      const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });
      const isValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      await prisma.user.update({ where: { id: user!.id }, data: { passwordHash } });

      return NextResponse.json({ message: "Password berhasil diubah" });
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({ where: { id: user!.id }, data: parsed.data });

    return NextResponse.json({ name: updated.name, email: updated.email, avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
