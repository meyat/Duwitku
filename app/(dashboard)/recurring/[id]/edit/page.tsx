import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurringForm } from "@/components/recurring/recurring-form";

export default async function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const item = await prisma.recurringTransaction.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });

  if (!item) notFound();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/recurring" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Edit Transaksi Berulang</h1>
      </div>

      <RecurringForm
        initial={{
          id: item.id,
          type: item.type,
          name: item.name,
          amount: item.amount.toString(),
          categoryId: item.categoryId ?? "",
          frequency: item.frequency,
          customIntervalDays: item.customIntervalDays?.toString() ?? "30",
          startDate: item.startDate.toISOString().slice(0, 10),
          endDate: item.endDate ? item.endDate.toISOString().slice(0, 10) : "",
          requireConfirmation: item.requireConfirmation,
        }}
      />
    </div>
  );
}
