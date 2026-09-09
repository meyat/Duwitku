"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Inbox, Pause, Play, Check, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useCurrencyFormat } from "@/lib/hooks/use-currency-format";
import { useConfirm } from "@/components/confirm-dialog-provider";

interface RecurringItem {
  id: string;
  name: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  frequency: string;
  nextRunDate: string;
  isActive: boolean;
  requireConfirmation: boolean;
  category: { name: string } | null;
}

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  YEARLY: "Tahunan",
  CUSTOM: "Interval Khusus",
};

export default function RecurringPage() {
  const formatCurrency = useCurrencyFormat();
  const confirmDialog = useConfirm();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/recurring");
    setItems(await res.json());
    setLoading(false);
  }

  async function runDue() {
    setRunning(true);
    try {
      const res = await fetch("/api/recurring/run", { method: "POST" });
      const data = await res.json();
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} transaksi berulang berhasil dibuat`);
      }
      await load();
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    // Jalankan auto-generate untuk item yang jatuh tempo, lalu muat daftar
    runDue();
  }, []);

  async function handleToggle(id: string) {
    await fetch(`/api/recurring/${id}/toggle`, { method: "POST" });
    await load();
    toast.success("Status transaksi berulang diperbarui");
  }

  async function handleConfirm(id: string) {
    const res = await fetch(`/api/recurring/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal membuat transaksi");
      return;
    }
    toast.success("Transaksi berhasil dibuat");
    await load();
  }

  async function handleDelete(item: RecurringItem) {
    const ok = await confirmDialog({
      title: `Hapus transaksi berulang "${item.name}"?`,
      description: "Aksi ini tidak bisa dibatalkan.",
      danger: true,
      confirmLabel: "Hapus",
    });
    if (!ok) return;

    const res = await fetch(`/api/recurring/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaksi berulang dihapus");
      setItems((i) => i.filter((x) => x.id !== item.id));
    } else {
      toast.error("Gagal menghapus transaksi berulang");
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transaksi Berulang</h1>
          <p className="text-sm text-muted-foreground">Otomatiskan pencatatan transaksi rutin</p>
        </div>
        <Link href="/recurring/new">
          <Button>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading || running ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : items.length ? (
            items.map((item) => {
              const isDue = new Date(item.nextRunDate) <= new Date();
              return (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.amount)} · {FREQUENCY_LABEL[item.frequency]} · Berikutnya{" "}
                      {formatDate(item.nextRunDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {!item.isActive && <Badge variant="default">Nonaktif</Badge>}
                    {item.isActive && isDue && item.requireConfirmation && (
                      <Button size="sm" variant="success" onClick={() => handleConfirm(item.id)}>
                        <Check className="h-3.5 w-3.5" /> Konfirmasi
                      </Button>
                    )}
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                      title={item.isActive ? "Jeda" : "Aktifkan"}
                    >
                      {item.isActive ? (
                        <Pause className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-success" />
                      )}
                    </button>
                    <Link
                      href={`/recurring/${item.id}/edit`}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger-soft transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada transaksi berulang</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
