import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { calculateNextRunDate } from "@/lib/recurring-utils";

// GET: list item yang sudah jatuh tempo (untuk ditampilkan / butuh konfirmasi)
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const now = new Date();

  const dueItems = await prisma.recurringTransaction.findMany({
    where: {
      userId: user!.id,
      deletedAt: null,
      isActive: true,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { category: true },
  });

  return NextResponse.json(dueItems);
}

// POST: jalankan semua yang tidak butuh konfirmasi (auto-generate)
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const now = new Date();
  let createdCount = 0;

  const dueItems = await prisma.recurringTransaction.findMany({
    where: {
      userId: user!.id,
      deletedAt: null,
      isActive: true,
      requireConfirmation: false,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  for (const item of dueItems) {
    let nextRun = item.nextRunDate;
    let iterations = 0;

    // Catch up on missed occurrences, cap at 24 to prevent runaway loops
    while (nextRun <= now && iterations < 24) {
      // Prevent duplicate transaction on the exact same schedule date
      const existing = await prisma.transaction.findFirst({
        where: { sourceType: "recurring", sourceId: item.id, date: nextRun },
      });

      if (!existing) {
        await prisma.transaction.create({
          data: {
            userId: user!.id,
            title: item.name,
            amount: item.amount,
            type: item.type,
            categoryId: item.categoryId,
            date: nextRun,
            paymentMethod: "OTHER",
            sourceType: "recurring",
            sourceId: item.id,
          },
        });
        createdCount++;
      }

      nextRun = calculateNextRunDate(nextRun, item.frequency, item.customIntervalDays);
      iterations++;

      if (item.endDate && nextRun > item.endDate) break;
    }

    await prisma.recurringTransaction.update({
      where: { id: item.id },
      data: { nextRunDate: nextRun },
    });
  }

  return NextResponse.json({ createdCount });
}
