import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillForm } from "@/components/bills/bill-form";

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const bill = await prisma.bill.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });

  if (!bill) notFound();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bills" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Edit Tagihan</h1>
      </div>

      <BillForm
        initial={{
          id: bill.id,
          name: bill.name,
          amount: bill.amount.toString(),
          categoryId: bill.categoryId ?? "",
          dueDate: bill.dueDate.toISOString().slice(0, 10),
          reminderOffset: bill.reminderOffset,
          note: bill.note ?? "",
        }}
      />
    </div>
  );
}
