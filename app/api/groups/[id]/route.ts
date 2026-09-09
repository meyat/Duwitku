import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { getAcceptedGroupOrError, getAcceptedMemberIds } from "@/lib/group-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const { group, membership } = await getAcceptedGroupOrError(id, user!.id);

  if (!group || !membership) {
    return NextResponse.json({ error: "Grup tidak ditemukan atau kamu bukan anggota" }, { status: 404 });
  }

  const memberIds = getAcceptedMemberIds(group);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [allTimeAgg, monthAgg, recentTransactions, savingGoals] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: { in: memberIds }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: { in: memberIds }, deletedAt: null, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: { in: memberIds }, deletedAt: null },
      include: { category: true, user: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.groupSavingGoal.findMany({
      where: { groupId: id },
      include: { contributions: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalIncome = Number(allTimeAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const totalExpense = Number(allTimeAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);
  const monthIncome = Number(monthAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const monthExpense = Number(monthAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);

  return NextResponse.json({
    ...group,
    isOwner: group.ownerId === user!.id,
    stats: {
      totalBalance: totalIncome - totalExpense,
      monthIncome,
      monthExpense,
    },
    recentTransactions,
    savingGoals,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

  if (group.ownerId !== user!.id) {
    return NextResponse.json({ error: "Hanya pemilik grup yang bisa menghapus grup" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id } });

  return NextResponse.json({ message: "Grup berhasil dihapus" });
}
