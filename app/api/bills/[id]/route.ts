import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { billSchema } from "@/lib/validations-planning";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = billSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.bill.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

    const bill = await prisma.bill.update({ where: { id }, data: parsed.data });
    return NextResponse.json(bill);
  } catch (err) {
    console.error("Update bill error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.bill.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

  await prisma.bill.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Tagihan berhasil dihapus" });
}
