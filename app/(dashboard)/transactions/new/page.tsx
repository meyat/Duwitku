import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Tambah Transaksi</h1>
          <p className="text-sm text-muted-foreground">Catat pemasukan atau pengeluaran baru</p>
        </div>
      </div>

      <TransactionForm />
    </div>
  );
}
