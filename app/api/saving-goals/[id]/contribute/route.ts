import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { contributionSchema } from "@/lib/validations-planning";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = contributionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const goal = await prisma.savingGoal.findFirst({
      where: { id, userId: user!.id, deletedAt: null },
    });
    if (!goal) return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });

    const newAmount = Number(goal.currentAmount) + parsed.data.amount;

    if (newAmount < 0) {
      return NextResponse.json(
        { error: "Dana target tabungan tidak boleh menjadi negatif" },
        { status: 400 }
      );
    }

    const newStatus =
      newAmount >= Number(goal.targetAmount) && goal.status === "ACTIVE" ? "ACHIEVED" : goal.status;

    const [updatedGoal] = await prisma.$transaction([
      prisma.savingGoal.update({
        where: { id },
        data: { currentAmount: newAmount, status: newStatus },
      }),
      prisma.savingContribution.create({
        data: {
          savingGoalId: id,
          amount: parsed.data.amount,
          note: parsed.data.note,
        },
      }),
    ]);

    return NextResponse.json(updatedGoal);
  } catch (err) {
    console.error("Contribute saving goal error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
