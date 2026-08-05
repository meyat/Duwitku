import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

interface CommitRow {
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string | null;
  date: string;
  paymentMethod: string;
  tags: string[];
  note: string | null;
  rowHash: string;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const rows: CommitRow[] = body.rows ?? [];
    const fileName: string = body.fileName ?? "import.csv";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Tidak ada data valid untuk diimport" }, { status: 400 });
    }

    // Pastikan semua tag yang direferensikan sudah ada, buat jika belum
    const allTagNames = Array.from(new Set(rows.flatMap((r) => r.tags)));
    const existingTags = await prisma.tag.findMany({
      where: { userId: user!.id, name: { in: allTagNames } },
    });
    const existingTagMap = new Map(existingTags.map((t) => [t.name, t.id]));

    const tagsToCreate = allTagNames.filter((name) => !existingTagMap.has(name));
    if (tagsToCreate.length > 0) {
      await prisma.tag.createMany({
        data: tagsToCreate.map((name) => ({ userId: user!.id, name })),
        skipDuplicates: true,
      });
      const refreshedTags = await prisma.tag.findMany({
        where: { userId: user!.id, name: { in: tagsToCreate } },
      });
      for (const t of refreshedTags) existingTagMap.set(t.name, t.id);
    }

    let created = 0;
    for (const row of rows) {
      await prisma.transaction.create({
        data: {
          userId: user!.id,
          title: row.title,
          amount: row.amount,
          type: row.type,
          categoryId: row.categoryId,
          date: new Date(row.date),
          paymentMethod: row.paymentMethod as never,
          note: row.note,
          tags: {
            create: row.tags
              .map((name) => existingTagMap.get(name))
              .filter((id): id is string => !!id)
              .map((tagId) => ({ tagId })),
          },
        },
      });
      created++;
    }

    await prisma.importLog.create({
      data: {
        userId: user!.id,
        fileName,
        rowHash: rows.map((r) => r.rowHash).join(","),
        totalRows: rows.length,
        validRows: created,
        invalidRows: 0,
      },
    });

    return NextResponse.json({ created });
  } catch (err) {
    console.error("Import commit error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan saat menyimpan data" }, { status: 500 });
  }
}
