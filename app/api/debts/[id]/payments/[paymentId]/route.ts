import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { recalculateDebtStatus } from "@/lib/debt-utils";

const editPaymentSchema = z.object({
  paidAmount: z.number().positive("Nominal pembayaran tidak boleh negatif"),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "E_WALLET", "DEBIT_CARD", "CREDIT_CARD", "OTHER"]),
  note: z.string().max(500).optional().nullable(),
});

async function recalculateInstallmentFromPayments(installmentId: string) {
  const installment = await prisma.installment.findUniqueOrThrow({
    where: { id: installmentId },
    include: { payments: { where: { cancelledAt: null } } },
  });

  const totalPaid = installment.payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
  const cappedPaid = Math.min(totalPaid, Number(installment.billedAmount));

  const status =
    cappedPaid >= Number(installment.billedAmount)
      ? "PAID"
      : cappedPaid > 0
        ? "PARTIALLY_PAID"
        : "UNPAID";

  await prisma.installment.update({
    where: { id: installmentId },
    data: { paidAmount: totalPaid, status },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id: debtId, paymentId } = await params;

  try {
    const body = await req.json();
    const parsed = editPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const debt = await prisma.debt.findFirst({ where: { id: debtId, userId: user!.id, deletedAt: null } });
    if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { installment: true },
    });
    if (!payment || payment.installment.debtId !== debtId || payment.cancelledAt) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paidAmount: parsed.data.paidAmount,
        paymentDate: parsed.data.paymentDate,
        paymentMethod: parsed.data.paymentMethod,
        note: parsed.data.note,
      },
    });

    await recalculateInstallmentFromPayments(payment.installmentId);
    await recalculateDebtStatus(debtId);

    return NextResponse.json({ message: "Pembayaran berhasil diperbarui" });
  } catch (err) {
    console.error("Edit payment error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id: debtId, paymentId } = await params;

  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId: user!.id, deletedAt: null } });
  if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { installment: true },
  });
  if (!payment || payment.installment.debtId !== debtId || payment.cancelledAt) {
    return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { cancelledAt: new Date() } });

    if (payment.transactionId) {
      await tx.transaction.update({
        where: { id: payment.transactionId },
        data: { deletedAt: new Date() },
      });
    }
  });

  await recalculateInstallmentFromPayments(payment.installmentId);
  await recalculateDebtStatus(debtId);

  return NextResponse.json({ message: "Pembayaran berhasil dibatalkan" });
}
