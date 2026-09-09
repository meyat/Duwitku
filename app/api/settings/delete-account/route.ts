import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  await prisma.user.delete({ where: { id: user!.id } });

  return NextResponse.json({ message: "Akun berhasil dihapus" });
}
