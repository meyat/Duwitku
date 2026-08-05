import { prisma } from "@/lib/prisma";

/**
 * Cek kondisi data user (tagihan, utang/piutang, target tabungan) dan buat
 * notifikasi baru jika ada event yang relevan dan belum pernah dinotifikasi.
 */
export async function generateNotificationsForUser(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) return;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const created: string[] = [];

  async function notifyOnce(
    type: string,
    title: string,
    message: string,
    link: string
  ) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: { userId, type: type as never, message, createdAt: { gte: oneDayAgo } },
    });
    if (existing) return;
    await prisma.notification.create({
      data: { userId, type: type as never, title, message, link },
    });
    created.push(message);
  }

  if (prefs.billReminder) {
    const dueBills = await prisma.bill.findMany({
      where: { userId, deletedAt: null, status: { in: ["UNPAID", "LATE"] }, dueDate: { lte: in7Days } },
    });
    for (const bill of dueBills) {
      const isLate = bill.status === "LATE";
      await notifyOnce(
        isLate ? "BILL_LATE" : "BILL_DUE_SOON",
        isLate ? "Tagihan Terlambat" : "Tagihan Mendekati Jatuh Tempo",
        `${bill.name} - jatuh tempo ${bill.dueDate.toLocaleDateString("id-ID")}`,
        `/bills`
      );
    }
  }

  if (prefs.debtReminder) {
    const debts = await prisma.debt.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ["ACTIVE", "PARTIALLY_PAID", "LATE"] },
        dueDate: { lte: in7Days, not: null },
      },
    });
    for (const debt of debts) {
      await notifyOnce(
        debt.type === "DEBT" ? "DEBT_DUE_SOON" : "RECEIVABLE_DUE_SOON",
        debt.type === "DEBT" ? "Utang Mendekati Jatuh Tempo" : "Piutang Mendekati Jatuh Tempo",
        `${debt.title} - ${debt.counterpartyName}`,
        `/debts/${debt.id}`
      );
    }
  }

  if (prefs.savingGoalReminder) {
    const goals = await prisma.savingGoal.findMany({
      where: { userId, deletedAt: null, status: "ACTIVE", deadline: { lte: in7Days, not: null } },
    });
    for (const goal of goals) {
      await notifyOnce(
        "SAVING_GOAL_DEADLINE_SOON",
        "Target Tabungan Mendekati Deadline",
        `${goal.name} - deadline ${goal.deadline?.toLocaleDateString("id-ID")}`,
        `/saving-goals/${goal.id}`
      );
    }
  }

  return created;
}
