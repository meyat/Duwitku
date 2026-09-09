import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { debtSchema } from "@/lib/validations-planning";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({
    where: { id, userId: user!.id, deletedAt: null },
    include: {
      installments: {
        orderBy: { installmentNo: "asc" },
        include: { payments: { orderBy: { paymentDate: "desc" } } },
      },
    },
  });

  if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const totalPaid =
    Number(debt.downPayment) + debt.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
  const remaining = Math.max(0, Number(debt.totalAmount) - totalPaid);
  const completedInstallments = debt.installments.filter((i) => i.status === "PAID").length;
  const nextInstallment = debt.installments.find((i) => i.status !== "PAID" && i.status !== "CANCELLED" && i.status !== "SKIPPED");

  return NextResponse.json({
    ...debt,
    totalPaid,
    remaining,
    completedInstallments,
    pendingInstallments: debt.installments.length - completedInstallments,
    nextInstallment,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = debtSchema
      .pick({
        title: true,
        counterpartyName: true,
        dueDate: true,
        contactNumber: true,
        note: true,
        paymentMethod: true,
      })
      .partial()
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.debt.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    const debt = await prisma.debt.update({ where: { id }, data: parsed.data });
    return NextResponse.json(debt);
  } catch (err) {
    console.error("Update debt error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.debt.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  await prisma.debt.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Data berhasil dihapus" });
}
