import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BillForm } from "@/components/bills/bill-form";

export default function NewBillPage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bills" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Tagihan Baru</h1>
      </div>

      <BillForm />
    </div>
  );
}
