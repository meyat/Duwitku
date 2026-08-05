import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { categorySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;

  const categories = await prisma.category.findMany({
    where: { userId: user!.id, deletedAt: null, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId: user!.id,
        name: parsed.data.name,
        type: parsed.data.type,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: { ...parsed.data, userId: user!.id },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("Create category error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
