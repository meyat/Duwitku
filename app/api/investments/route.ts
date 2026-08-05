import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { investmentSchema } from "@/lib/validations-investment";
import { safePercentage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const investments = await prisma.investment.findMany({
    where: { userId: user!.id, deletedAt: null, ...(type ? { type: type as never } : {}) },
    orderBy: { purchaseDate: "desc" },
  });

  const enriched = investments.map((inv) => {
    const totalCapital = Number(inv.units) * Number(inv.avgBuyPrice);
    const currentValue = Number(inv.units) * Number(inv.currentPrice);
    const profitLoss = currentValue - totalCapital;
    return {
      ...inv,
      totalCapital,
      currentValue,
      profitLoss,
      profitLossPercent: safePercentage(profitLoss, totalCapital),
    };
  });

  const summary = {
    totalCapital: enriched.reduce((sum, i) => sum + i.totalCapital, 0),
    totalCurrentValue: enriched.reduce((sum, i) => sum + i.currentValue, 0),
    totalProfitLoss: enriched.reduce((sum, i) => sum + i.profitLoss, 0),
  };

  return NextResponse.json({ investments: enriched, summary });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = investmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.create({ data: { ...parsed.data, userId: user!.id } });

    return NextResponse.json(investment, { status: 201 });
  } catch (err) {
    console.error("Create investment error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
