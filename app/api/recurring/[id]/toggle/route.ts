import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.recurringTransaction.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const item = await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return NextResponse.json(item);
}
