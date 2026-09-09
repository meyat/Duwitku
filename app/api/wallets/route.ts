import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { walletSchema } from "@/lib/validations-wallet";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const wallets = await prisma.wallet.findMany({
    where: { userId: user!.id, deletedAt: null, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: { createdAt: "asc" },
  });

  // Hitung saldo tiap wallet = initialBalance + total pemasukan - total pengeluaran
  const enriched = await Promise.all(
    wallets.map(async (wallet) => {
      const agg = await prisma.transaction.groupBy({
        by: ["type"],
        where: { walletId: wallet.id, deletedAt: null },
        _sum: { amount: true },
      });
      const income = Number(agg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
      const expense = Number(agg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);
      const balance = Number(wallet.initialBalance) + income - expense;

      return { ...wallet, balance };
    })
  );

  const totalBalance = enriched.reduce((sum, w) => sum + w.balance, 0);

  return NextResponse.json({ wallets: enriched, totalBalance });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = walletSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: { ...parsed.data, userId: user!.id },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (err) {
    console.error("Create wallet error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
