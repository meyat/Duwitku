import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({
      transactions: [],
      categories: [],
      tags: [],
      bills: [],
      savingGoals: [],
      debts: [],
      investments: [],
    });
  }

  const insensitive = { contains: q, mode: "insensitive" as const };

  const [transactions, categories, tags, bills, savingGoals, debts, investments] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, deletedAt: null, OR: [{ title: insensitive }, { note: insensitive }] },
      take: 5,
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId, deletedAt: null, name: insensitive },
      take: 5,
    }),
    prisma.tag.findMany({
      where: { userId, name: insensitive },
      take: 5,
    }),
    prisma.bill.findMany({
      where: { userId, deletedAt: null, name: insensitive },
      take: 5,
    }),
    prisma.savingGoal.findMany({
      where: { userId, deletedAt: null, name: insensitive },
      take: 5,
    }),
    prisma.debt.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [{ title: insensitive }, { counterpartyName: insensitive }],
      },
      take: 5,
    }),
    prisma.investment.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [{ name: insensitive }, { symbol: insensitive }],
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ transactions, categories, tags, bills, savingGoals, debts, investments });
}
