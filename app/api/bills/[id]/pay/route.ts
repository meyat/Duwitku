import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const paySchema = z.object({
  createTransaction: z.boolean().default(true),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "E_WALLET", "DEBIT_CARD", "CREDIT_CARD", "OTHER"])
    .default("CASH"),
  paidAt: z.coerce.date().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const bill = await prisma.bill.findFirst({ where: { id, userId: user!.id, deletedAt: null } });
    if (!bill) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

    if (bill.status === "PAID") {
      return NextResponse.json({ error: "Tagihan sudah dibayar" }, { status: 409 });
    }

    const paidAt = parsed.data.paidAt ?? new Date();

    const [updatedBill] = await prisma.$transaction([
      prisma.bill.update({
        where: { id },
        data: { status: "PAID", paidAt },
      }),
      ...(parsed.data.createTransaction
        ? [
            prisma.transaction.create({
              data: {
                userId: user!.id,
                title: bill.name,
                amount: bill.amount,
                type: "EXPENSE",
                categoryId: bill.categoryId,
                date: paidAt,
                paymentMethod: parsed.data.paymentMethod,
                sourceType: "bill",
                sourceId: bill.id,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(updatedBill);
  } catch (err) {
    console.error("Pay bill error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
