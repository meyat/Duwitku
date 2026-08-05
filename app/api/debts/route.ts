import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { debtSchema } from "@/lib/validations-planning";
import { calculateAutomaticInstallments } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const counterpartyName = searchParams.get("counterpartyName");

  const debts = await prisma.debt.findMany({
    where: {
      userId: user!.id,
      deletedAt: null,
      ...(type ? { type: type as never } : {}),
      ...(status ? { status: status as never } : {}),
      ...(counterpartyName ? { counterpartyName: { contains: counterpartyName, mode: "insensitive" } } : {}),
    },
    include: { installments: true },
    orderBy: { createdAt: "desc" },
  });

  const enriched = debts.map((d) => {
    const totalPaid =
      Number(d.downPayment) + d.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    return {
      ...d,
      totalPaid,
      remaining: Math.max(0, Number(d.totalAmount) - totalPaid),
    };
  });

  const summary = {
    totalActiveDebt: enriched
      .filter((d) => d.type === "DEBT" && !["PAID_OFF", "CANCELLED"].includes(d.status))
      .reduce((sum, d) => sum + d.remaining, 0),
    totalActiveReceivable: enriched
      .filter((d) => d.type === "RECEIVABLE" && !["PAID_OFF", "CANCELLED"].includes(d.status))
      .reduce((sum, d) => sum + d.remaining, 0),
  };

  return NextResponse.json({ debts: enriched, summary });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = debtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.downPayment > data.totalAmount) {
      return NextResponse.json(
        { error: "Uang muka tidak boleh melebihi total nominal" },
        { status: 400 }
      );
    }

    let installmentsToCreate: { installmentNo: number; dueDate: Date; billedAmount: number }[] = [];

    if (data.installmentSystem === "AUTOMATIC") {
      if (!data.months || data.months < 1) {
        return NextResponse.json(
          { error: "Jumlah bulan cicilan minimal satu bulan" },
          { status: 400 }
        );
      }
      const firstDate = data.firstPaymentDate ?? data.startDate;
      const amounts = calculateAutomaticInstallments(data.totalAmount, data.downPayment, data.months);

      installmentsToCreate = amounts.map((amount, i) => {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return { installmentNo: i + 1, dueDate, billedAmount: amount };
      });
    } else {
      if (!data.manualInstallments || data.manualInstallments.length === 0) {
        return NextResponse.json(
          { error: "Jadwal cicilan manual wajib diisi minimal satu" },
          { status: 400 }
        );
      }

      const totalManual = data.manualInstallments.reduce((sum, i) => sum + i.billedAmount, 0);
      const remainingAfterDp = data.totalAmount - data.downPayment;

      if (totalManual > remainingAfterDp) {
        const confirmOverage = (body as { confirmOverage?: boolean }).confirmOverage;
        if (!confirmOverage) {
          return NextResponse.json(
            {
              error: "OVERAGE_CONFIRMATION_REQUIRED",
              message: `Total jadwal cicilan (${totalManual}) melebihi sisa nominal setelah uang muka (${remainingAfterDp}). Konfirmasi untuk tetap menyimpan.`,
            },
            { status: 409 }
          );
        }
      }

      installmentsToCreate = data.manualInstallments
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .map((i, idx) => ({ installmentNo: idx + 1, dueDate: i.dueDate, billedAmount: i.billedAmount }));
    }

    const debt = await prisma.$transaction(async (tx) => {
      const newDebt = await tx.debt.create({
        data: {
          userId: user!.id,
          title: data.title,
          counterpartyName: data.counterpartyName,
          type: data.type,
          totalAmount: data.totalAmount,
          startDate: data.startDate,
          dueDate: data.dueDate,
          contactNumber: data.contactNumber,
          note: data.note,
          paymentMethod: data.paymentMethod,
          installmentSystem: data.installmentSystem,
          downPayment: data.downPayment,
          status: data.downPayment >= data.totalAmount ? "PAID_OFF" : "ACTIVE",
        },
      });

      await tx.installment.createMany({
        data: installmentsToCreate.map((i) => ({ ...i, debtId: newDebt.id })),
      });

      return newDebt;
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (err) {
    console.error("Create debt error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
