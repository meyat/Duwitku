import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: user!.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "Semua notifikasi ditandai sudah dibaca" });
}
