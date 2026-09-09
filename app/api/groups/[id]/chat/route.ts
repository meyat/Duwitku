import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { getAcceptedGroupOrError } from "@/lib/group-utils";

const schema = z.object({
  content: z.string().min(1, "Pesan tidak boleh kosong").max(2000),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const { group, membership } = await getAcceptedGroupOrError(id, user!.id);
  if (!group || !membership) {
    return NextResponse.json({ error: "Grup tidak ditemukan atau kamu bukan anggota" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after"); // ISO date, buat polling pesan baru

  const messages = await prisma.groupChatMessage.findMany({
    where: {
      groupId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: after ? undefined : 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const { group, membership } = await getAcceptedGroupOrError(id, user!.id);
  if (!group || !membership) {
    return NextResponse.json({ error: "Grup tidak ditemukan atau kamu bukan anggota" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const message = await prisma.groupChatMessage.create({
      data: { groupId: id, userId: user!.id, content: parsed.data.content },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("Send group chat error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
