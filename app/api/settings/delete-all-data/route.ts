import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),
    prisma.savingGoal.deleteMany({ where: { userId } }),
    prisma.bill.deleteMany({ where: { userId } }),
    prisma.recurringTransaction.deleteMany({ where: { userId } }),
    prisma.debt.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.importLog.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ message: "Seluruh data berhasil dihapus" });
}
