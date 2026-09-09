import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { categorySchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId: user!.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(category);
  } catch (err) {
    console.error("Update category error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.category.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  const usageCount = await prisma.transaction.count({
    where: { categoryId: id, deletedAt: null },
  });

  if (usageCount > 0) {
    return NextResponse.json(
      { error: `Kategori masih digunakan oleh ${usageCount} transaksi` },
      { status: 409 }
    );
  }

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Kategori berhasil dihapus" });
}
