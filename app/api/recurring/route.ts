import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { recurringSchema } from "@/lib/validations-planning";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const items = await prisma.recurringTransaction.findMany({
    where: { userId: user!.id, deletedAt: null },
    include: { category: true },
    orderBy: { nextRunDate: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = recurringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const item = await prisma.recurringTransaction.create({
      data: { ...parsed.data, userId: user!.id, nextRunDate: parsed.data.startDate },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("Create recurring error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
