import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "./default-categories";

/**
 * Seed data demo (user contoh + transaksi, tagihan, target tabungan, dll).
 * Dipakai baik oleh CLI script (prisma/seed.ts) maupun API route /api/dev-seed
 * (untuk kasus tanpa akses terminal, seeding dipicu lewat browser).
 */
export async function seedDemoData(prisma: PrismaClient) {
  console.log("🌱 Mulai seeding data demo...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@financetracker.com" },
    update: {},
    create: {
      name: "Pengguna Demo",
      email: "demo@financetracker.com",
      passwordHash,
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Kategori default
  const existingCategories = await prisma.category.count({ where: { userId: user.id } });
  if (existingCategories === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id, isDefault: true })),
    });
  }

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const gaji = categories.find((c) => c.name === "Gaji")!;
  const makan = categories.find((c) => c.name === "Makanan dan Minuman")!;
  const transport = categories.find((c) => c.name === "Transportasi")!;
  const hiburan = categories.find((c) => c.name === "Hiburan")!;
  const tagihanKat = categories.find((c) => c.name === "Tagihan")!;

  // Tag
  const tagNames = ["Bulanan", "Kebutuhan", "Darurat", "Pribadi"];
  await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name },
      })
    )
  );
  const tags = await prisma.tag.findMany({ where: { userId: user.id } });

  // Transaksi 6 bulan terakhir
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    await prisma.transaction.create({
      data: {
        userId: user.id,
        title: "Gaji Bulanan",
        amount: 8_000_000,
        type: "INCOME",
        categoryId: gaji.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        paymentMethod: "BANK_TRANSFER",
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        title: "Belanja Bulanan",
        amount: 1_200_000,
        type: "EXPENSE",
        categoryId: makan.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        paymentMethod: "E_WALLET",
        tags: { create: [{ tagId: tags.find((t) => t.name === "Bulanan")!.id }] },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        title: "Bensin & Transport",
        amount: 400_000,
        type: "EXPENSE",
        categoryId: transport.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
        paymentMethod: "CASH",
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        title: "Nonton Bioskop",
        amount: 150_000,
        type: "EXPENSE",
        categoryId: hiburan.id,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
        paymentMethod: "E_WALLET",
        tags: { create: [{ tagId: tags.find((t) => t.name === "Pribadi")!.id }] },
      },
    });
  }

  // Target tabungan
  await prisma.savingGoal.createMany({
    data: [
      {
        userId: user.id,
        name: "Dana Darurat",
        targetAmount: 20_000_000,
        currentAmount: 8_500_000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1),
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "Beli Laptop",
        targetAmount: 15_000_000,
        currentAmount: 15_000_000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        status: "ACHIEVED",
      },
    ],
  });

  // Tagihan
  await prisma.bill.createMany({
    data: [
      {
        userId: user.id,
        name: "Listrik",
        amount: 350_000,
        categoryId: tagihanKat.id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
        status: "UNPAID",
      },
      {
        userId: user.id,
        name: "Internet",
        amount: 300_000,
        categoryId: tagihanKat.id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
        status: "UNPAID",
      },
      {
        userId: user.id,
        name: "PDAM",
        amount: 100_000,
        categoryId: tagihanKat.id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        status: "PAID",
        paidAt: new Date(now.getFullYear(), now.getMonth(), 9),
      },
    ],
  });

  // Transaksi berulang
  await prisma.recurringTransaction.createMany({
    data: [
      {
        userId: user.id,
        name: "Gaji Bulanan",
        amount: 8_000_000,
        type: "INCOME",
        categoryId: gaji.id,
        frequency: "MONTHLY",
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
      {
        userId: user.id,
        name: "Langganan Netflix",
        amount: 65_000,
        type: "EXPENSE",
        categoryId: hiburan.id,
        frequency: "MONTHLY",
        startDate: new Date(now.getFullYear(), now.getMonth(), 3),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 3),
      },
    ],
  });

  // Utang & Piutang contoh sederhana
  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      title: "Cicilan Laptop",
      counterpartyName: "Toko Elektronik Jaya",
      type: "DEBT",
      totalAmount: 12_000_000,
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      installmentSystem: "AUTOMATIC",
      status: "PARTIALLY_PAID",
    },
  });

  await prisma.installment.createMany({
    data: Array.from({ length: 12 }).map((_, i) => ({
      debtId: debt.id,
      installmentNo: i + 1,
      dueDate: new Date(now.getFullYear(), now.getMonth() - 2 + i, 1),
      billedAmount: 1_000_000,
      paidAmount: i < 2 ? 1_000_000 : 0,
      status: i < 2 ? "PAID" : "UNPAID",
    })),
  });

  await prisma.debt.create({
    data: {
      userId: user.id,
      title: "Pinjaman ke Teman",
      counterpartyName: "Budi Santoso",
      type: "RECEIVABLE",
      totalAmount: 2_000_000,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      installmentSystem: "MANUAL",
      status: "ACTIVE",
    },
  });

  // Investasi
  await prisma.investment.createMany({
    data: [
      {
        userId: user.id,
        name: "Bank Central Asia",
        symbol: "BBCA",
        type: "STOCK",
        units: 100,
        avgBuyPrice: 9_000,
        currentPrice: 9_500,
        purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      },
      {
        userId: user.id,
        name: "Bitcoin",
        symbol: "BTC",
        type: "CRYPTO",
        units: 0.01,
        avgBuyPrice: 900_000_000,
        currentPrice: 950_000_000,
        purchaseDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      },
      {
        userId: user.id,
        name: "Emas Antam",
        type: "GOLD",
        units: 10,
        avgBuyPrice: 1_100_000,
        currentPrice: 1_150_000,
        purchaseDate: new Date(now.getFullYear(), now.getMonth() - 4, 10),
      },
    ],
  });

  console.log("✅ Seeding selesai!");
  console.log("   Email: demo@financetracker.com");
  console.log("   Password: password123");

  return { email: "demo@financetracker.com", password: "password123" };
}
