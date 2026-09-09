import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { savingGoalSchema } from "@/lib/validations-planning";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const goals = await prisma.savingGoal.findMany({
    where: { userId: user!.id, deletedAt: null, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = savingGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    if (parsed.data.deadline && parsed.data.deadline < new Date()) {
      return NextResponse.json(
        { error: "Deadline tidak boleh lebih awal dari tanggal dibuat" },
        { status: 400 }
      );
    }

    const goal = await prisma.savingGoal.create({
      data: { ...parsed.data, userId: user!.id },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    console.error("Create saving goal error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
