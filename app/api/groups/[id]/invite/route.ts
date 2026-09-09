import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { MAX_GROUP_MEMBERS } from "@/lib/group-utils";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });
    if (group.ownerId !== user!.id) {
      return NextResponse.json({ error: "Hanya pemilik grup yang bisa mengundang anggota" }, { status: 403 });
    }

    const activeCount = group.members.filter((m) => m.status !== "DECLINED").length;
    if (activeCount >= MAX_GROUP_MEMBERS) {
      return NextResponse.json(
        { error: `Grup sudah mencapai maksimal ${MAX_GROUP_MEMBERS} anggota` },
        { status: 409 }
      );
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "Tidak ada akun Duwitku dengan email tersebut. Minta mereka daftar dulu." },
        { status: 404 }
      );
    }

    const existing = group.members.find((m) => m.userId === invitedUser.id);
    if (existing) {
      if (existing.status === "DECLINED") {
        await prisma.groupMember.update({
          where: { id: existing.id },
          data: { status: "PENDING", invitedAt: new Date(), respondedAt: null },
        });
        return NextResponse.json({ message: "Undangan berhasil dikirim ulang" });
      }
      return NextResponse.json({ error: "Orang ini sudah jadi anggota atau masih menunggu konfirmasi" }, { status: 409 });
    }

    await prisma.groupMember.create({
      data: { groupId: id, userId: invitedUser.id, status: "PENDING" },
    });

    return NextResponse.json({ message: "Undangan berhasil dikirim" }, { status: 201 });
  } catch (err) {
    console.error("Invite member error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
