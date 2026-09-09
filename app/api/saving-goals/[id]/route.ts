import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { savingGoalSchema } from "@/lib/validations-planning";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const goal = await prisma.savingGoal.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
    include: { contributions: { orderBy: { date: "desc" } } },
  });

  if (!goal) return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });

  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = savingGoalSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.savingGoal.findFirst({
      where: { id, userId: user!.id, deletedAt: null },
    });
    if (!existing) return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });

    const goal = await prisma.savingGoal.update({ where: { id }, data: parsed.data });
    return NextResponse.json(goal);
  } catch (err) {
    console.error("Update saving goal error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.savingGoal.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });

  await prisma.savingGoal.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Target tabungan berhasil dihapus" });
}
