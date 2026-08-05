import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { transactionSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(transaction);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user!.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const { tagIds, ...data } = parsed.data;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.transactionTag.deleteMany({ where: { transactionId: id } });
      return tx.transaction.update({
        where: { id },
        data: {
          ...data,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
        include: { category: true, tags: { include: { tag: true } } },
      });
    });

    return NextResponse.json(transaction);
  } catch (err) {
    console.error("Update transaction error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ message: "Transaksi berhasil dihapus" });
}
