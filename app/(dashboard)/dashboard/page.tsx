"use client";

import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  Receipt,
  HandCoins,
  LineChart,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { SummaryCard, SummaryCardSkeleton } from "@/components/dashboard/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, daysUntil, safePercentage } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan kondisi keuangan kamu</p>
      </div>

      {error && (
        <Card className="border-danger/30 bg-danger-soft">
          <CardContent className="py-4 text-sm text-danger">{error}</CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading || !data ? (
          Array.from({ length: 8 }).map((_, i) => <SummaryCardSkeleton key={i} />)
        ) : (
          <>
            <SummaryCard label="Saldo Saat Ini" value={data.balance} icon={Wallet} tone="primary" />
            <SummaryCard label="Pemasukan Bulan Ini" value={data.monthIncome} icon={TrendingUp} tone="success" />
            <SummaryCard label="Pengeluaran Bulan Ini" value={data.monthExpense} icon={TrendingDown} tone="danger" />
            <SummaryCard
              label="Selisih Bulan Ini"
              value={data.monthDiff}
              icon={Scale}
              tone={data.monthDiff >= 0 ? "success" : "danger"}
            />
            <SummaryCard label="Tabungan Terkumpul" value={data.savingsCollected} icon={PiggyBank} tone="primary" />
            <SummaryCard label="Total Utang" value={data.totalDebt} icon={HandCoins} tone="danger" />
            <SummaryCard label="Total Piutang" value={data.totalReceivable} icon={HandCoins} tone="success" />
            <SummaryCard label="Nilai Investasi" value={data.totalInvestmentValue} icon={LineChart} tone="warning" />
          </>
        )}
      </div>

      {!loading && data && data.dueSoonBillsCount > 0 && (
        <Card className="border-warning/30 bg-warning-soft">
          <CardContent className="py-3 flex items-center gap-3">
            <Receipt className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground">
              Ada <span className="font-semibold">{data.dueSoonBillsCount} tagihan</span> yang akan
              jatuh tempo dalam 7 hari ke depan.
            </p>
            <Link href="/bills" className="ml-auto text-sm font-medium text-primary hover:underline whitespace-nowrap">
              Lihat
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between p-5">
            <CardTitle className="text-foreground text-base font-semibold">Transaksi Terbaru</CardTitle>
            <Link href="/transactions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-0">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))
            ) : data?.recentTransactions.length ? (
              data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category?.name ?? "Tanpa kategori"} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ml-3 ${
                      t.type === "INCOME" ? "text-success" : "text-danger"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState text="Belum ada transaksi" />
            )}
          </CardContent>
        </Card>

        {/* Upcoming bills */}
        <Card>
          <CardHeader className="flex-row items-center justify-between p-5">
            <CardTitle className="text-foreground text-base font-semibold">Tagihan Terdekat</CardTitle>
            <Link href="/bills" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-0">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))
            ) : data?.upcomingBills.length ? (
              data.upcomingBills.map((b) => {
                const days = daysUntil(b.dueDate);
                return (
                  <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(b.amount)}</p>
                    </div>
                    <Badge variant={days < 0 ? "danger" : days <= 3 ? "warning" : "default"}>
                      {days < 0 ? `Terlambat ${Math.abs(days)}h` : days === 0 ? "Hari ini" : `${days} hari lagi`}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Tidak ada tagihan mendatang" />
            )}
          </CardContent>
        </Card>

        {/* Active saving goals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between p-5">
            <CardTitle className="text-foreground text-base font-semibold">Target Tabungan Aktif</CardTitle>
            <Link href="/saving-goals" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)
            ) : data?.activeSavingGoals.length ? (
              data.activeSavingGoals.map((g) => {
                const pct = Math.min(
                  100,
                  safePercentage(Number(g.currentAmount), Number(g.targetAmount))
                );
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(g.currentAmount)} dari {formatCurrency(g.targetAmount)}
                    </p>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Belum ada target tabungan" />
            )}
          </CardContent>
        </Card>

        {/* Debt/Receivable summary */}
        <Card>
          <CardHeader className="p-5">
            <CardTitle className="text-foreground text-base font-semibold">Ringkasan Utang & Piutang</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-danger-soft p-3">
              <p className="text-xs text-muted-foreground mb-1">Utang Aktif</p>
              <p className="text-base font-semibold text-danger">
                {loading || !data ? "..." : data.debtSummary.activeDebtCount}
              </p>
            </div>
            <div className="rounded-lg bg-success-soft p-3">
              <p className="text-xs text-muted-foreground mb-1">Piutang Aktif</p>
              <p className="text-base font-semibold text-success">
                {loading || !data ? "..." : data.debtSummary.activeReceivableCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
