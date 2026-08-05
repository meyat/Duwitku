"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Scale, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CategoryPieChart, type PieDatum } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart, type MonthlyDatum } from "@/components/charts/monthly-bar-chart";

interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  diff: number;
  avgDailyExpense: number;
  topExpenseCategory: PieDatum | null;
  comparison: {
    incomeChangePercent: number;
    expenseChangePercent: number;
  };
  expenseByCategory: PieDatum[];
  incomeByCategory: PieDatum[];
  monthlyChart: MonthlyDatum[];
  investmentComposition: { name: string; value: number }[];
  totalInvestmentValue: number;
}

const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  STOCK: "Saham",
  CRYPTO: "Crypto",
  BOND: "Obligasi",
  MUTUAL_FUND: "Reksa Dana",
  GOLD: "Emas",
};

export default function StatisticsPage() {
  const [period, setPeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (period === "custom" && dateFrom && dateTo) {
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
    }
    fetch(`/api/statistics?${params.toString()}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Statistik</h1>
          <p className="text-sm text-muted-foreground">Pahami pola keuangan kamu</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
            <option value="custom">Rentang Khusus</option>
          </Select>
        </div>
      </div>

      {period === "custom" && (
        <div className="flex gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Total Pemasukan"
          value={data?.totalIncome ?? 0}
          tone="success"
          changePercent={data?.comparison.incomeChangePercent}
          loading={loading}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Pengeluaran"
          value={data?.totalExpense ?? 0}
          tone="danger"
          changePercent={data?.comparison.expenseChangePercent}
          loading={loading}
        />
        <StatCard icon={Scale} label="Selisih" value={data?.diff ?? 0} tone={data && data.diff >= 0 ? "success" : "danger"} loading={loading} />
        <StatCard icon={Calendar} label="Rata-rata / Hari" value={data?.avgDailyExpense ?? 0} tone="warning" loading={loading} />
      </div>

      {data?.topExpenseCategory && (
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: data.topExpenseCategory.color }}
            >
              {data.topExpenseCategory.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kategori Pengeluaran Terbesar</p>
              <p className="text-sm font-semibold text-foreground">
                {data.topExpenseCategory.name} — {formatCurrency(data.topExpenseCategory.value)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">Komposisi Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="skeleton h-64 rounded-lg" /> : <CategoryPieChart data={data?.expenseByCategory ?? []} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">Komposisi Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="skeleton h-64 rounded-lg" /> : <CategoryPieChart data={data?.incomeByCategory ?? []} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Pemasukan vs Pengeluaran (6 Bulan Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="skeleton h-72 rounded-lg" /> : <MonthlyBarChart data={data?.monthlyChart ?? []} />}
        </CardContent>
      </Card>

      {data && data.investmentComposition.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">Komposisi Investasi</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={data.investmentComposition.map((c) => ({
                name: INVESTMENT_TYPE_LABELS[c.name] ?? c.name,
                value: c.value,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  changePercent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "success" | "danger" | "warning";
  changePercent?: number;
  loading: boolean;
}) {
  const toneClasses = {
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
    warning: "bg-warning/15 text-warning",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-6 w-24 rounded" />
      ) : (
        <>
          <span className="text-base font-semibold text-foreground tabular-nums">{formatCurrency(value)}</span>
          {changePercent !== undefined && (
            <span className={`text-xs font-medium ${changePercent >= 0 ? "text-success" : "text-danger"}`}>
              {changePercent >= 0 ? "▲" : "▼"} {Math.abs(changePercent).toFixed(1)}% vs periode lalu
            </span>
          )}
        </>
      )}
    </div>
  );
}
