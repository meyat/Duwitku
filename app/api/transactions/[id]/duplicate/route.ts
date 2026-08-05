import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const original = await prisma.transaction.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
    include: { tags: true },
  });

  if (!original) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  const duplicate = await prisma.transaction.create({
    data: {
      userId: user!.id,
      title: `${original.title} (Salinan)`,
      amount: original.amount,
      type: original.type,
      categoryId: original.categoryId,
      date: new Date(),
      paymentMethod: original.paymentMethod,
      note: original.note,
      tags: { create: original.tags.map((t) => ({ tagId: t.tagId })) },
    },
    include: { category: true, tags: { include: { tag: true } } },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
