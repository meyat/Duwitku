"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Inbox, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";

interface BillItem {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  status: "UNPAID" | "PAID" | "LATE";
  category: { name: string; color: string } | null;
}

const STATUS_BADGE: Record<string, "default" | "success" | "danger" | "warning"> = {
  UNPAID: "warning",
  PAID: "success",
  LATE: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Sudah Dibayar",
  LATE: "Terlambat",
};

export default function BillsPage() {
  const [filter, setFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/bills${params}`);
    setBills(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handlePay(id: string) {
    setPayingId(id);
    try {
      const res = await fetch(`/api/bills/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createTransaction: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menandai tagihan");
        return;
      }
      toast.success("Tagihan ditandai sudah dibayar & transaksi dibuat otomatis");
      await load();
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tagihan</h1>
          <p className="text-sm text-muted-foreground">Jangan sampai telat bayar</p>
        </div>
        <Link href="/bills/new">
          <Button>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </Link>
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[
          { value: "ALL", label: "Semua" },
          { value: "UNPAID", label: "Belum Dibayar" },
          { value: "PAID", label: "Sudah Dibayar" },
        ]}
      />

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : bills.length ? (
            bills.map((bill) => {
              const days = daysUntil(bill.dueDate);
              return (
                <div key={bill.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(bill.amount)} · Jatuh tempo {formatDate(bill.dueDate)}
                      {bill.status !== "PAID" && (
                        <span> ({days < 0 ? `terlambat ${Math.abs(days)}h` : days === 0 ? "hari ini" : `${days} hari lagi`})</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant={STATUS_BADGE[bill.status]}>{STATUS_LABEL[bill.status]}</Badge>
                    {bill.status !== "PAID" && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handlePay(bill.id)}
                        disabled={payingId === bill.id}
                      >
                        {payingId === bill.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Tidak ada tagihan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
