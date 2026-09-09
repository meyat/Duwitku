import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { getAcceptedGroupOrError } from "@/lib/group-utils";

const schema = z.object({
  amount: z.number().refine((v) => v !== 0, "Nominal tidak boleh nol"),
  note: z.string().max(300).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id, goalId } = await params;

  const { group, membership } = await getAcceptedGroupOrError(id, user!.id);
  if (!group || !membership) {
    return NextResponse.json({ error: "Grup tidak ditemukan atau kamu bukan anggota" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const goal = await prisma.groupSavingGoal.findFirst({ where: { id: goalId, groupId: id } });
    if (!goal) return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });

    const contribution = await prisma.groupSavingContribution.create({
      data: {
        groupSavingGoalId: goalId,
        userId: user!.id,
        amount: parsed.data.amount,
        note: parsed.data.note,
      },
    });

    // Cek apakah target sudah tercapai
    const allContributions = await prisma.groupSavingContribution.findMany({
      where: { groupSavingGoalId: goalId },
    });
    const totalCollected = allContributions.reduce((sum, c) => sum + Number(c.amount), 0);

    if (totalCollected >= Number(goal.targetAmount) && goal.status === "ACTIVE") {
      await prisma.groupSavingGoal.update({ where: { id: goalId }, data: { status: "ACHIEVED" } });
    }

    return NextResponse.json(contribution, { status: 201 });
  } catch (err) {
    console.error("Contribute group saving goal error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
