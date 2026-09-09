import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { billSchema } from "@/lib/validations-planning";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  // Auto-mark late bills
  await prisma.bill.updateMany({
    where: { userId: user!.id, status: "UNPAID", dueDate: { lt: new Date() } },
    data: { status: "LATE" },
  });

  const bills = await prisma.bill.findMany({
    where: {
      userId: user!.id,
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
    },
    include: { category: true },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = billSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const bill = await prisma.bill.create({ data: { ...parsed.data, userId: user!.id } });

    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    console.error("Create bill error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
