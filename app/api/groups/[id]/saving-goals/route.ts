import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { getAcceptedGroupOrError } from "@/lib/group-utils";

const schema = z.object({
  name: z.string().min(1, "Nama target wajib diisi").max(100),
  targetAmount: z.number().positive("Nominal target harus lebih besar dari nol"),
  deadline: z.coerce.date().nullable().optional(),
});

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

    const goal = await prisma.groupSavingGoal.create({
      data: { ...parsed.data, groupId: id },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    console.error("Create group saving goal error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
