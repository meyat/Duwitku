import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { installmentPaymentSchema } from "@/lib/validations-planning";
import { recalculateDebtStatus } from "@/lib/debt-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id: debtId, installmentId } = await params;

  try {
    const body = await req.json();
    const parsed = installmentPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId: user!.id, deletedAt: null },
      include: { installments: { orderBy: { installmentNo: "asc" } } },
    });
    if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    const installment = debt.installments.find((i) => i.id === installmentId);
    if (!installment) return NextResponse.json({ error: "Cicilan tidak ditemukan" }, { status: 404 });

    const { paidAmount, paymentDate, paymentMethod, note, overpayStrategy, createTransaction } = parsed.data;

    const currentTotalPaid =
      Number(debt.downPayment) + debt.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    const totalRemaining = Number(debt.totalAmount) - currentTotalPaid;

    if (paidAmount > totalRemaining) {
      const confirmOverpay = (body as { confirmOverpay?: boolean }).confirmOverpay;
      if (!confirmOverpay) {
        return NextResponse.json(
          {
            error: "OVERPAY_CONFIRMATION_REQUIRED",
            message: `Nominal pembayaran (${paidAmount}) melebihi sisa keseluruhan (${totalRemaining}). Konfirmasi untuk tetap melanjutkan.`,
          },
          { status: 409 }
        );
      }
    }

    const balanceBefore = totalRemaining;
    const newInstallmentPaid = Number(installment.paidAmount) + paidAmount;
    const excess = newInstallmentPaid - Number(installment.billedAmount);

    const result = await prisma.$transaction(async (tx) => {
      // Update this installment
      await tx.installment.update({
        where: { id: installment.id },
        data: {
          paidAmount: excess > 0 ? installment.billedAmount : newInstallmentPaid,
          status: newInstallmentPaid >= Number(installment.billedAmount) ? "PAID" : "PARTIALLY_PAID",
        },
      });

      // Handle overpay routed to next installment based on strategy
      if (excess > 0 && overpayStrategy && overpayStrategy !== "EXTRA") {
        const nextInstallment = debt.installments.find(
          (i) => i.installmentNo > installment.installmentNo && i.status !== "PAID" && i.status !== "CANCELLED"
        );

        if (nextInstallment) {
          if (overpayStrategy === "REDUCE_NEXT") {
            const newBilled = Math.max(0, Number(nextInstallment.billedAmount) - excess);
            await tx.installment.update({
              where: { id: nextInstallment.id },
              data: { billedAmount: newBilled },
            });
          } else if (overpayStrategy === "AUTO_SETTLE_NEXT") {
            const appliedToNext = Math.min(excess, Number(nextInstallment.billedAmount));
            const nextNewPaid = Number(nextInstallment.paidAmount) + appliedToNext;
            await tx.installment.update({
              where: { id: nextInstallment.id },
              data: {
                paidAmount: nextNewPaid,
                status: nextNewPaid >= Number(nextInstallment.billedAmount) ? "PAID" : "PARTIALLY_PAID",
              },
            });
          }
        }
      } else if (excess > 0 && (!overpayStrategy || overpayStrategy === "EXTRA")) {
        // Simpan sebagai pembayaran tambahan: biarkan paidAmount installment ini melebihi billedAmount
        await tx.installment.update({
          where: { id: installment.id },
          data: { paidAmount: newInstallmentPaid },
        });
      }

      const balanceAfter = balanceBefore - paidAmount;

      const payment = await tx.payment.create({
        data: {
          installmentId: installment.id,
          expectedAmount: installment.billedAmount,
          paidAmount,
          paymentDate,
          paymentMethod,
          note,
          balanceBefore,
          balanceAfter: Math.max(0, balanceAfter),
        },
      });

      if (createTransaction) {
        const transaction = await tx.transaction.create({
          data: {
            userId: user!.id,
            title: `Pembayaran ${debt.type === "DEBT" ? "Utang" : "Piutang"}: ${debt.title}`,
            amount: paidAmount,
            type: debt.type === "DEBT" ? "EXPENSE" : "INCOME",
            date: paymentDate,
            paymentMethod,
            note: `Cicilan #${installment.installmentNo} - ${debt.counterpartyName}`,
            sourceType: "installment_payment",
            sourceId: payment.id,
          },
        });

        await tx.payment.update({ where: { id: payment.id }, data: { transactionId: transaction.id } });
      }

      return payment;
    });

    await recalculateDebtStatus(debtId);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Pay installment error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
