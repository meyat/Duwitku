import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { safePercentage } from "@/lib/utils";

function getPeriodRange(period: string, dateFrom?: string | null, dateTo?: string | null) {
  const now = new Date();

  if (period === "custom" && dateFrom && dateTo) {
    return { start: new Date(dateFrom), end: new Date(dateTo + "T23:59:59") };
  }

  if (period === "weekly") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "yearly") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }

  // default: monthly
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

function getPreviousRange(start: Date, end: Date) {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "monthly";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const { start, end } = getPeriodRange(period, dateFrom, dateTo);
  const { start: prevStart, end: prevEnd } = getPreviousRange(start, end);

  const [transactions, prevAgg, investments] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: start, lte: end } },
      include: { category: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null, date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
    prisma.investment.findMany({ where: { userId, deletedAt: null } }),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const avgDailyExpense = totalExpense / daysInPeriod;

  // Expense by category (pie chart)
  const expenseByCategory = new Map<string, { name: string; color: string; value: number }>();
  for (const t of transactions.filter((t) => t.type === "EXPENSE")) {
    const key = t.category?.id ?? "uncategorized";
    const existing = expenseByCategory.get(key);
    if (existing) {
      existing.value += Number(t.amount);
    } else {
      expenseByCategory.set(key, {
        name: t.category?.name ?? "Tanpa Kategori",
        color: t.category?.color ?? "#64748B",
        value: Number(t.amount),
      });
    }
  }

  // Income by category
  const incomeByCategory = new Map<string, { name: string; color: string; value: number }>();
  for (const t of transactions.filter((t) => t.type === "INCOME")) {
    const key = t.category?.id ?? "uncategorized";
    const existing = incomeByCategory.get(key);
    if (existing) {
      existing.value += Number(t.amount);
    } else {
      incomeByCategory.set(key, {
        name: t.category?.name ?? "Tanpa Kategori",
        color: t.category?.color ?? "#64748B",
        value: Number(t.amount),
      });
    }
  }

  const expenseCategoryArray = Array.from(expenseByCategory.values()).sort((a, b) => b.value - a.value);
  const topExpenseCategory = expenseCategoryArray[0] ?? null;

  // Monthly income/expense bar chart (last 6 months containing the period)
  const monthlyBuckets: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    monthlyBuckets.push({
      month: monthStart.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      income: 0,
      expense: 0,
    });

    const idx = monthlyBuckets.length - 1;
    for (const t of transactions) {
      const tDate = new Date(t.date);
      if (tDate >= monthStart && tDate <= monthEnd) {
        if (t.type === "INCOME") monthlyBuckets[idx].income += Number(t.amount);
        else monthlyBuckets[idx].expense += Number(t.amount);
      }
    }
  }

  // Need all-transactions for 6-month bar chart (not just current period) — refetch broader range
  const sixMonthsAgo = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const broadTransactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null, date: { gte: sixMonthsAgo, lte: end } },
  });

  const monthlyChart = monthlyBuckets.map((bucket, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (5 - i), 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    let income = 0;
    let expense = 0;
    for (const t of broadTransactions) {
      const tDate = new Date(t.date);
      if (tDate >= monthStart && tDate <= monthEnd) {
        if (t.type === "INCOME") income += Number(t.amount);
        else expense += Number(t.amount);
      }
    }
    return { month: bucket.month, income, expense };
  });

  // Investment composition
  const investmentByType = new Map<string, number>();
  let totalInvestmentValue = 0;
  for (const inv of investments) {
    const value = Number(inv.units) * Number(inv.currentPrice);
    totalInvestmentValue += value;
    investmentByType.set(inv.type, (investmentByType.get(inv.type) ?? 0) + value);
  }
  const investmentComposition = Array.from(investmentByType.entries()).map(([type, value]) => ({
    name: type,
    value,
  }));

  const prevIncome = Number(prevAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const prevExpense = Number(prevAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);

  return NextResponse.json({
    period: { start, end },
    totalIncome,
    totalExpense,
    diff: totalIncome - totalExpense,
    avgDailyExpense,
    topExpenseCategory,
    comparison: {
      prevIncome,
      prevExpense,
      incomeChangePercent: safePercentage(totalIncome - prevIncome, prevIncome || 1),
      expenseChangePercent: safePercentage(totalExpense - prevExpense, prevExpense || 1),
    },
    expenseByCategory: expenseCategoryArray,
    incomeByCategory: Array.from(incomeByCategory.values()).sort((a, b) => b.value - a.value),
    monthlyChart,
    investmentComposition,
    totalInvestmentValue,
  });
}
