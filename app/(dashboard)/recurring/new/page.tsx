import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecurringForm } from "@/components/recurring/recurring-form";

export default function NewRecurringPage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/recurring" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Transaksi Berulang Baru</h1>
      </div>

      <RecurringForm />
    </div>
  );
}
