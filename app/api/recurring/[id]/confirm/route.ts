import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { calculateNextRunDate } from "@/lib/recurring-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const item = await prisma.recurringTransaction.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
  });
  if (!item) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const existing = await prisma.transaction.findFirst({
    where: { sourceType: "recurring", sourceId: item.id, date: item.nextRunDate },
  });

  if (existing) {
    return NextResponse.json({ error: "Transaksi untuk jadwal ini sudah dibuat" }, { status: 409 });
  }

  const nextRun = calculateNextRunDate(item.nextRunDate, item.frequency, item.customIntervalDays);

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user!.id,
        title: item.name,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        date: item.nextRunDate,
        paymentMethod: "OTHER",
        sourceType: "recurring",
        sourceId: item.id,
      },
    }),
    prisma.recurringTransaction.update({ where: { id }, data: { nextRunDate: nextRun } }),
  ]);

  return NextResponse.json(transaction);
}
