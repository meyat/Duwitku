import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { walletSchema } from "@/lib/validations-wallet";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = walletSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.wallet.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

    const wallet = await prisma.wallet.update({ where: { id }, data: parsed.data });
    return NextResponse.json(wallet);
  } catch (err) {
    console.error("Update wallet error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.wallet.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

  const usageCount = await prisma.transaction.count({ where: { walletId: id, deletedAt: null } });

  if (usageCount > 0) {
    return NextResponse.json(
      {
        error: `Wallet masih dipakai oleh ${usageCount} transaksi. Arsipkan saja kalau tidak dipakai lagi, atau pindahkan transaksinya dulu.`,
      },
      { status: 409 }
    );
  }

  await prisma.wallet.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Wallet berhasil dihapus" });
}
