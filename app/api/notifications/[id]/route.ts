import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.notification.findFirst({ where: { id, userId: user!.id } });
  if (!existing) return NextResponse.json({ error: "Notifikasi tidak ditemukan" }, { status: 404 });

  const notification = await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json(notification);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.notification.findFirst({ where: { id, userId: user!.id } });
  if (!existing) return NextResponse.json({ error: "Notifikasi tidak ditemukan" }, { status: 404 });

  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ message: "Notifikasi dihapus" });
}
