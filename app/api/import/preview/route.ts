import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { validateImportRow, type RawImportRow } from "@/lib/import-utils";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const rows: RawImportRow[] = body.rows ?? [];
    const dateFormat: string = body.dateFormat ?? "DD/MM/YYYY";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Data CSV kosong atau tidak valid" }, { status: 400 });
    }

    const MAX_ROWS = 2000;
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Maksimal ${MAX_ROWS} baris per import` }, { status: 400 });
    }

    const validated = rows.map((row, i) => validateImportRow(row, i, dateFormat));

    // Cek duplikasi terhadap transaksi yang sudah ada
    const existingHashes = new Set<string>();
    const existingTransactions = await prisma.transaction.findMany({
      where: { userId: user!.id, deletedAt: null },
      select: { title: true, amount: true, type: true, date: true },
    });
    for (const t of existingTransactions) {
      const hash = `${t.title}|${Number(t.amount)}|${t.type}|${t.date.toISOString().slice(0, 10)}`;
      existingHashes.add(hash);
    }

    const categories = await prisma.category.findMany({
      where: { userId: user!.id, deletedAt: null },
    });

    const result = validated.map((row) => {
      const isDuplicate = existingHashes.has(
        `${row.title}|${row.amount}|${row.type}|${row.date?.toISOString().slice(0, 10)}`
      );
      const matchedCategory = row.categoryName
        ? categories.find(
            (c) => c.name.toLowerCase() === row.categoryName!.toLowerCase() && c.type === row.type
          )
        : null;

      return {
        ...row,
        isDuplicate,
        categoryMatched: !!matchedCategory,
        categoryId: matchedCategory?.id ?? null,
      };
    });

    const validCount = result.filter((r) => r.isValid && !r.isDuplicate).length;
    const invalidCount = result.filter((r) => !r.isValid).length;
    const duplicateCount = result.filter((r) => r.isValid && r.isDuplicate).length;

    return NextResponse.json({
      rows: result,
      summary: { total: result.length, valid: validCount, invalid: invalidCount, duplicate: duplicateCount },
    });
  } catch (err) {
    console.error("Import preview error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses file" }, { status: 500 });
  }
}
