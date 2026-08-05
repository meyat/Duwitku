import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { transactionSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
  const search = searchParams.get("search") ?? undefined;
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const tagId = searchParams.get("tagId") ?? undefined;
  const paymentMethod = searchParams.get("paymentMethod") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const minAmount = searchParams.get("minAmount") ?? undefined;
  const maxAmount = searchParams.get("maxAmount") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? "date";
  const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc";

  const where: Prisma.TransactionWhereInput = {
    userId: user!.id,
    deletedAt: null,
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(paymentMethod ? { paymentMethod: paymentMethod as never } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { note: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(minAmount || maxAmount
      ? {
          amount: {
            ...(minAmount ? { gte: parseFloat(minAmount) } : {}),
            ...(maxAmount ? { lte: parseFloat(maxAmount) } : {}),
          },
        }
      : {}),
  };

  const [transactions, total, aggregates] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = aggregates.find((a) => a.type === "INCOME")?._sum.amount ?? 0;
  const totalExpense = aggregates.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0;

  return NextResponse.json({
    transactions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    summary: { totalIncome, totalExpense },
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const { tagIds, ...data } = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: user!.id,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: { category: true, tags: { include: { tag: true } } },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("Create transaction error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
