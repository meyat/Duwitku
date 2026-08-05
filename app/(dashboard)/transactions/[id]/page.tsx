import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Tag as TagIcon, Wallet, Calendar, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button";
import { DuplicateTransactionButton } from "@/components/transactions/duplicate-transaction-button";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  E_WALLET: "E-Wallet",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  OTHER: "Lainnya",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!transaction) notFound();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Detail Transaksi</h1>
      </div>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-5">
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-1">{transaction.title}</p>
            <p
              className={`text-3xl font-bold tabular-nums ${
                transaction.type === "INCOME" ? "text-success" : "text-danger"
              }`}
            >
              {transaction.type === "INCOME" ? "+" : "-"}
              {formatCurrency(Number(transaction.amount))}
            </p>
            <Badge variant={transaction.type === "INCOME" ? "success" : "danger"} className="mt-2">
              {transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
            </Badge>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <DetailRow icon={Calendar} label="Tanggal" value={formatDate(transaction.date)} />
            <DetailRow
              icon={Wallet}
              label="Kategori"
              value={transaction.category?.name ?? "Tanpa kategori"}
            />
            <DetailRow
              icon={Wallet}
              label="Metode Pembayaran"
              value={PAYMENT_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod}
            />
            {transaction.tags.length > 0 && (
              <DetailRow
                icon={TagIcon}
                label="Tag"
                value={transaction.tags.map((t) => t.tag.name).join(", ")}
              />
            )}
            {transaction.note && (
              <DetailRow icon={FileText} label="Catatan" value={transaction.note} />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/transactions/${transaction.id}/edit`}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <DuplicateTransactionButton id={transaction.id} />
        <DeleteTransactionButton id={transaction.id} />
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}
