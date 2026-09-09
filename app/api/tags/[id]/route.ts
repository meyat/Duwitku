import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { tagSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = tagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.tag.findFirst({ where: { id, userId: user!.id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag tidak ditemukan" }, { status: 404 });
    }

    const tag = await prisma.tag.update({ where: { id }, data: parsed.data });
    return NextResponse.json(tag);
  } catch (err) {
    console.error("Update tag error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.tag.findFirst({ where: { id, userId: user!.id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag tidak ditemukan" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ message: "Tag berhasil dihapus" });
}
