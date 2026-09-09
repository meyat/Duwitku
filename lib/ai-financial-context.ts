import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, currency: true } });
  const currency = user?.currency ?? "IDR";

  const [
    allTimeAgg,
    monthAgg,
    monthByCategory,
    wallets,
    savingGoals,
    debts,
    investments,
    sixMonthTx,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null, type: "EXPENSE", date: { gte: startOfMonth, lte: endOfMonth } },
      include: { category: true },
    }),
    prisma.wallet.findMany({ where: { userId, deletedAt: null, isArchived: false } }),
    prisma.savingGoal.findMany({ where: { userId, deletedAt: null, status: "ACTIVE" } }),
    prisma.debt.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "PARTIALLY_PAID", "LATE"] } },
      include: { installments: true },
    }),
    prisma.investment.findMany({ where: { userId, deletedAt: null } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: sixMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
  ]);

  const totalIncome = Number(allTimeAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const totalExpense = Number(allTimeAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  const monthIncome = Number(monthAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
  const monthExpense = Number(monthAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);

  const categoryTotals = new Map<string, number>();
  for (const t of monthByCategory) {
    const name = t.category?.name ?? "Tanpa kategori";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + Number(t.amount));
  }
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Rata-rata pemasukan/pengeluaran bulanan 6 bulan terakhir
  const monthlyBuckets = new Map<string, { income: number; expense: number }>();
  for (const t of sixMonthTx) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const bucket = monthlyBuckets.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
    monthlyBuckets.set(key, bucket);
  }
  const months = Array.from(monthlyBuckets.values());
  const avgMonthlyIncome = months.length ? months.reduce((s, m) => s + m.income, 0) / months.length : monthIncome;
  const avgMonthlyExpense = months.length ? months.reduce((s, m) => s + m.expense, 0) / months.length : monthExpense;

  let debtTotal = 0;
  let receivableTotal = 0;
  for (const d of debts) {
    const paid = d.installments.reduce((s, i) => s + Number(i.paidAmount), 0);
    const remaining = Number(d.totalAmount) - Number(d.downPayment) - paid;
    if (d.type === "DEBT") debtTotal += remaining;
    else receivableTotal += remaining;
  }

  const totalInvestmentValue = investments.reduce(
    (sum, inv) => sum + Number(inv.units) * Number(inv.currentPrice),
    0
  );

  const fmt = (n: number) => formatCurrency(n, currency);

  const lines = [
    `Nama pengguna: ${user?.name ?? "Pengguna"}`,
    `Mata uang: ${currency}`,
    ``,
    `=== RINGKASAN SALDO ===`,
    `Saldo saat ini (semua waktu): ${fmt(balance)}`,
    `Total pemasukan bulan ini: ${fmt(monthIncome)}`,
    `Total pengeluaran bulan ini: ${fmt(monthExpense)}`,
    `Selisih bulan ini: ${fmt(monthIncome - monthExpense)}`,
    `Rata-rata pemasukan per bulan (6 bulan terakhir): ${fmt(avgMonthlyIncome)}`,
    `Rata-rata pengeluaran per bulan (6 bulan terakhir): ${fmt(avgMonthlyExpense)}`,
    ``,
    `=== KATEGORI PENGELUARAN TERBESAR BULAN INI ===`,
    ...(topCategories.length
      ? topCategories.map(([name, amount]) => `- ${name}: ${fmt(amount)}`)
      : ["Belum ada data pengeluaran bulan ini"]),
    ``,
    `=== WALLET ===`,
    ...(wallets.length
      ? wallets.map((w) => `- ${w.name} (${w.type}): saldo awal ${fmt(Number(w.initialBalance))}`)
      : ["Belum ada wallet yang didaftarkan"]),
    ``,
    `=== TARGET TABUNGAN AKTIF ===`,
    ...(savingGoals.length
      ? savingGoals.map(
          (g) =>
            `- ${g.name}: terkumpul ${fmt(Number(g.currentAmount))} dari target ${fmt(Number(g.targetAmount))}${
              g.deadline ? ` (deadline ${g.deadline.toLocaleDateString("id-ID")})` : ""
            }`
        )
      : ["Belum ada target tabungan aktif"]),
    ``,
    `=== UTANG & PIUTANG AKTIF ===`,
    `Total sisa utang: ${fmt(debtTotal)}`,
    `Total sisa piutang: ${fmt(receivableTotal)}`,
    ``,
    `=== INVESTASI ===`,
    `Total nilai investasi saat ini: ${fmt(totalInvestmentValue)}`,
  ];

  return lines.join("\n");
}
