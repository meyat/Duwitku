import { prisma } from "@/lib/prisma";

/**
 * Kumpulin SEMUA data milik satu user jadi satu objek JSON - buat backup
 * manual (tombol di Settings) maupun backup otomatis (cron + email).
 *
 * Catatan: data grup sharing (Group, GroupMember, dst) sengaja TIDAK
 * diikutkan karena itu data bersama/kepemilikan campuran antar user, bukan
 * data pribadi satu akun - includukan bisa bikin restore jadi ambigu.
 * AiChatMessage & Notification juga di-skip karena sifatnya sementara/log,
 * bukan data finansial inti yang perlu di-backup.
 */
export async function buildFullBackup(userId: string) {
  const [
    profile,
    wallets,
    categories,
    tags,
    transactions,
    savingGoals,
    bills,
    recurringTransactions,
    debts,
    investments,
    notificationPreference,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        currency: true,
        dateFormat: true,
        timezone: true,
        theme: true,
        weekStartsOn: true,
        aiProvider: true,
        createdAt: true,
      },
    }),
    prisma.wallet.findMany({ where: { userId, deletedAt: null } }),
    prisma.category.findMany({ where: { userId, deletedAt: null } }),
    prisma.tag.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: { tags: { include: { tag: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.savingGoal.findMany({
      where: { userId, deletedAt: null },
      include: { contributions: true },
    }),
    prisma.bill.findMany({ where: { userId, deletedAt: null } }),
    prisma.recurringTransaction.findMany({ where: { userId, deletedAt: null } }),
    prisma.debt.findMany({
      where: { userId, deletedAt: null },
      include: { installments: { include: { payments: true } } },
    }),
    prisma.investment.findMany({ where: { userId, deletedAt: null } }),
    prisma.notificationPreference.findUnique({ where: { userId } }),
  ]);

  return {
    backupVersion: 1,
    generatedAt: new Date().toISOString(),
    app: "Duwitku",
    profile,
    wallets,
    categories,
    tags,
    transactions: transactions.map((t) => ({
      ...t,
      tags: t.tags.map((tt) => tt.tag.name),
    })),
    savingGoals,
    bills,
    recurringTransactions,
    debts,
    investments,
    notificationPreference,
  };
}
