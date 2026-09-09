import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { tagSchema } from "@/lib/validations";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    where: { userId: user!.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = tagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.tag.findFirst({
      where: { userId: user!.id, name: parsed.data.name },
    });

    if (existing) {
      return NextResponse.json({ error: "Tag dengan nama ini sudah ada" }, { status: 409 });
    }

    const tag = await prisma.tag.create({ data: { ...parsed.data, userId: user!.id } });

    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    console.error("Create tag error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
