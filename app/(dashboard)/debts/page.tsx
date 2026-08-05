"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { formatCurrency, safePercentage, formatDate } from "@/lib/utils";

interface DebtItem {
  id: string;
  title: string;
  counterpartyName: string;
  type: "DEBT" | "RECEIVABLE";
  totalAmount: string;
  totalPaid: number;
  remaining: number;
  dueDate: string | null;
  status: string;
}

const STATUS_BADGE: Record<string, "default" | "success" | "danger" | "warning" | "primary"> = {
  ACTIVE: "primary",
  NOT_STARTED: "default",
  PARTIALLY_PAID: "warning",
  PAID_OFF: "success",
  LATE: "danger",
  CANCELLED: "default",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  NOT_STARTED: "Belum Mulai",
  PARTIALLY_PAID: "Dibayar Sebagian",
  PAID_OFF: "Lunas",
  LATE: "Terlambat",
  CANCELLED: "Dibatalkan",
};

export default function DebtsPage() {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEBT" | "RECEIVABLE">("ALL");
  const [statusFilter, setStatusFilter] = useState("");
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [summary, setSummary] = useState({ totalActiveDebt: 0, totalActiveReceivable: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/debts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setDebts(data.debts);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Utang & Piutang</h1>
          <p className="text-sm text-muted-foreground">Kelola cicilan dan pembayaran</p>
        </div>
        <Link href="/debts/new">
          <Button>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total Utang Aktif</p>
            <p className="text-lg font-semibold text-danger tabular-nums">
              {formatCurrency(summary.totalActiveDebt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total Piutang Aktif</p>
            <p className="text-lg font-semibold text-success tabular-nums">
              {formatCurrency(summary.totalActiveReceivable)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <SegmentedControl
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          options={[
            { value: "ALL", label: "Semua" },
            { value: "DEBT", label: "Utang" },
            { value: "RECEIVABLE", label: "Piutang" },
          ]}
          className="flex-1"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40 shrink-0">
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PARTIALLY_PAID">Dibayar Sebagian</option>
          <option value="LATE">Terlambat</option>
          <option value="PAID_OFF">Lunas</option>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-lg mb-1" />)
          ) : debts.length ? (
            debts.map((debt) => {
              const pct = Math.min(100, safePercentage(debt.totalPaid, Number(debt.totalAmount)));
              return (
                <Link
                  key={debt.id}
                  href={`/debts/${debt.id}`}
                  className="flex flex-col gap-2 py-3 border-b border-border last:border-0 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{debt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {debt.counterpartyName} · {debt.type === "DEBT" ? "Utang" : "Piutang"}
                        {debt.dueDate && ` · Jatuh tempo ${formatDate(debt.dueDate)}`}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[debt.status]}>{STATUS_LABEL[debt.status]}</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${debt.type === "DEBT" ? "bg-danger" : "bg-success"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(debt.totalPaid)} dari {formatCurrency(debt.totalAmount)} ({pct.toFixed(0)}%)
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <HandCoins className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada data utang/piutang</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
