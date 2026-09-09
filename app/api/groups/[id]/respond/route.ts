import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const schema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: user!.id } },
    });

    if (!membership || membership.status !== "PENDING") {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.groupMember.update({
      where: { id: membership.id },
      data: {
        status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        respondedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Respond invite error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
