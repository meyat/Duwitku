import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1, "Nama grup wajib diisi").max(100),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: user!.id, status: "ACCEPTED" } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name: parsed.data.name,
        ownerId: user!.id,
        members: {
          create: { userId: user!.id, status: "ACCEPTED", respondedAt: new Date() },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    console.error("Create group error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
