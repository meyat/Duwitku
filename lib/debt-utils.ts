import { prisma } from "@/lib/prisma";

/**
 * Hitung ulang status keseluruhan sebuah debt berdasarkan installment-nya,
 * lalu simpan ke database. Dipanggil setiap kali ada perubahan pembayaran.
 */
export async function recalculateDebtStatus(debtId: string) {
  const debt = await prisma.debt.findUniqueOrThrow({
    where: { id: debtId },
    include: { installments: true },
  });

  const now = new Date();
  const totalPaid =
    Number(debt.downPayment) + debt.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);

  // Update status per-installment (LATE detection)
  for (const inst of debt.installments) {
    if (inst.status === "CANCELLED" || inst.status === "SKIPPED") continue;
    const isOverdue = new Date(inst.dueDate) < now;
    const isFullyPaid = Number(inst.paidAmount) >= Number(inst.billedAmount);
    const isPartiallyPaid = Number(inst.paidAmount) > 0 && !isFullyPaid;

    let newStatus = inst.status;
    if (isFullyPaid) newStatus = "PAID";
    else if (isOverdue && isPartiallyPaid) newStatus = "LATE";
    else if (isOverdue && !isPartiallyPaid) newStatus = "LATE";
    else if (isPartiallyPaid) newStatus = "PARTIALLY_PAID";
    else newStatus = "UNPAID";

    if (newStatus !== inst.status) {
      await prisma.installment.update({ where: { id: inst.id }, data: { status: newStatus } });
    }
  }

  const refreshedInstallments = await prisma.installment.findMany({ where: { debtId } });
  const hasLate = refreshedInstallments.some((i) => i.status === "LATE");
  const hasAnyPaid = totalPaid > 0;
  const isPaidOff = totalPaid >= Number(debt.totalAmount);
  const hasStarted = new Date(debt.startDate) <= now;

  let overallStatus: typeof debt.status = "ACTIVE";
  if (debt.status === "CANCELLED") {
    overallStatus = "CANCELLED";
  } else if (isPaidOff) {
    overallStatus = "PAID_OFF";
  } else if (hasLate) {
    overallStatus = "LATE";
  } else if (hasAnyPaid) {
    overallStatus = "PARTIALLY_PAID";
  } else if (!hasStarted) {
    overallStatus = "NOT_STARTED";
  } else {
    overallStatus = "ACTIVE";
  }

  await prisma.debt.update({ where: { id: debtId }, data: { status: overallStatus } });

  return overallStatus;
}
