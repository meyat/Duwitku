import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id, memberId } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

  const member = await prisma.groupMember.findUnique({ where: { id: memberId } });
  if (!member || member.groupId !== id) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  const isSelf = member.userId === user!.id;
  const isOwner = group.ownerId === user!.id;

  if (!isSelf && !isOwner) {
    return NextResponse.json({ error: "Tidak punya izin untuk aksi ini" }, { status: 403 });
  }

  if (member.userId === group.ownerId) {
    return NextResponse.json({ error: "Pemilik grup tidak bisa dikeluarkan. Hapus grup kalau ingin membubarkannya." }, { status: 400 });
  }

  await prisma.groupMember.delete({ where: { id: memberId } });

  return NextResponse.json({ message: isSelf ? "Berhasil keluar dari grup" : "Anggota berhasil dikeluarkan" });
}
