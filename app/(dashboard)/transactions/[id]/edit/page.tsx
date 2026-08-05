import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: { tags: true },
  });

  if (!transaction) notFound();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/transactions/${id}`}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Edit Transaksi</h1>
        </div>
      </div>

      <TransactionForm
        initial={{
          id: transaction.id,
          title: transaction.title,
          amount: transaction.amount.toString(),
          type: transaction.type,
          categoryId: transaction.categoryId ?? "",
          date: transaction.date.toISOString().slice(0, 10),
          paymentMethod: transaction.paymentMethod,
          note: transaction.note ?? "",
          tagIds: transaction.tags.map((t) => t.tagId),
        }}
      />
    </div>
  );
}
