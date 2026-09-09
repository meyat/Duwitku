import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    allTimeAgg,
    monthAgg,
    recentTransactions,
    upcomingBills,
    activeSavingGoals,
    activeDebts,
    investments,
    dueSoonBillsCount,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: true, tags: { include: { tag: true } } },
    }),
    prisma.bill.findMany({
      where: { userId, deletedAt: null, status: { in: ["UNPAID", "LATE"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { category: true },
    }),
    prisma.savingGoal.findMany({
      where: { userId, deletedAt: null, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.debt.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "PARTIALLY_PAID", "LATE", "NOT_STARTED"] } },
      include: { installments: true },
    }),
    prisma.investment.findMany({ where: { userId, deletedAt: null } }),
    prisma.bill.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ["UNPAID", "LATE"] },
        dueDate: { lte: in7Days },
      },
    }),
  ]);

  const totalIncome = Number(allTimeAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const totalExpense = Number(allTimeAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  const monthIncome = Number(monthAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const monthExpense = Number(monthAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);

  const savingsCollected = activeSavingGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

  let totalDebt = 0;
  let totalReceivable = 0;
  for (const debt of activeDebts) {
    const paid = debt.installments.reduce((s, i) => s + Number(i.paidAmount), 0);
    const remaining = Number(debt.totalAmount) - paid;
    if (debt.type === "DEBT") totalDebt += remaining;
    else totalReceivable += remaining;
  }

  const totalInvestmentValue = investments.reduce(
    (sum, inv) => sum + Number(inv.units) * Number(inv.currentPrice),
    0
  );

  return NextResponse.json({
    balance,
    monthIncome,
    monthExpense,
    monthDiff: monthIncome - monthExpense,
    savingsCollected,
    dueSoonBillsCount,
    totalDebt,
    totalReceivable,
    totalInvestmentValue,
    recentTransactions,
    upcomingBills,
    activeSavingGoals,
    debtSummary: {
      activeDebtCount: activeDebts.filter((d) => d.type === "DEBT").length,
      activeReceivableCount: activeDebts.filter((d) => d.type === "RECEIVABLE").length,
    },
  });
}
