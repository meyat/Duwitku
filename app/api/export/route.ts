import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { formatDate } from "@/lib/utils";
import { Prisma } from "@prisma/client";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  E_WALLET: "E-Wallet",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  OTHER: "Lainnya",
};

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(cell) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv"; // csv | xlsx
  const scope = searchParams.get("scope") ?? "all"; // all | month | year | range
  const month = searchParams.get("month"); // YYYY-MM
  const year = searchParams.get("year"); // YYYY
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;

  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(type ? { type } : {}),
  };

  if (scope === "month" && month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
  } else if (scope === "year" && year) {
    const y = Number(year);
    where.date = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59) };
  } else if (scope === "range" && dateFrom && dateTo) {
    where.date = { gte: new Date(dateFrom), lte: new Date(dateTo + "T23:59:59") };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { date: "desc" },
  });

  const header = [
    "Judul",
    "Nominal",
    "Jenis",
    "Kategori",
    "Tanggal",
    "Metode Pembayaran",
    "Tag",
    "Catatan",
  ];

  const rows = transactions.map((t) => [
    t.title,
    t.amount.toString(),
    t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
    t.category?.name ?? "",
    formatDate(t.date),
    PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod,
    t.tags.map((tt) => tt.tag.name).join("; "),
    t.note ?? "",
  ]);

  const filename = `transaksi-export-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const csv = toCsv([header, ...rows]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
