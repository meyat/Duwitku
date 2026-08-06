"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Inbox, Pencil, Trash2, X, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface InvestmentItem {
  id: string;
  name: string;
  symbol: string | null;
  type: string;
  units: string;
  avgBuyPrice: string;
  currentPrice: string;
  purchaseDate: string;
  note: string | null;
  totalCapital: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

const TYPE_LABELS: Record<string, string> = {
  STOCK: "Saham",
  CRYPTO: "Crypto",
  BOND: "Obligasi",
  MUTUAL_FUND: "Reksa Dana",
  GOLD: "Emas",
};

const EMPTY_FORM = {
  name: "",
  symbol: "",
  type: "STOCK",
  units: "",
  avgBuyPrice: "",
  currentPrice: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: "",
};

export default function InvestmentsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [summary, setSummary] = useState({ totalCapital: 0, totalCurrentValue: 0, totalProfitLoss: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const params = typeFilter ? `?type=${typeFilter}` : "";
    const res = await fetch(`/api/investments${params}`);
    const data = await res.json();
    setInvestments(data.investments);
    setSummary(data.summary);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [typeFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(inv: InvestmentItem) {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      symbol: inv.symbol ?? "",
      type: inv.type,
      units: inv.units,
      avgBuyPrice: inv.avgBuyPrice,
      currentPrice: inv.currentPrice,
      purchaseDate: inv.purchaseDate.slice(0, 10),
      note: inv.note ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Nama aset wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      symbol: form.symbol || null,
      type: form.type,
      units: parseFloat(form.units),
      avgBuyPrice: parseFloat(form.avgBuyPrice),
      currentPrice: parseFloat(form.currentPrice),
      purchaseDate: form.purchaseDate,
      note: form.note || null,
    };

    try {
      const url = editingId ? `/api/investments/${editingId}` : "/api/investments";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setSaving(false);
        return;
      }
      toast.success(editingId ? "Investasi diperbarui" : "Investasi ditambahkan");
      setShowForm(false);
      await load();
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(inv: InvestmentItem) {
    if (!confirm(`Hapus investasi "${inv.name}"?`)) return;
    const res = await fetch(`/api/investments/${inv.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Investasi dihapus");
      await load();
    } else {
      toast.error("Gagal menghapus investasi");
    }
  }

  const pieData = Object.entries(
    investments.reduce((acc, inv) => {
      const label = TYPE_LABELS[inv.type] ?? inv.type;
      acc[label] = (acc[label] ?? 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const barData = Object.entries(
    investments.reduce((acc, inv) => {
      const label = TYPE_LABELS[inv.type] ?? inv.type;
      acc[label] = (acc[label] ?? 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, value]) => ({ type, value }));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Investasi</h1>
          <p className="text-sm text-muted-foreground">Catat daftar aset investasimu</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Modal</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(summary.totalCapital)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Nilai Saat Ini</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(summary.totalCurrentValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Untung/Rugi</p>
            <p className={`text-sm font-semibold tabular-nums ${summary.totalProfitLoss >= 0 ? "text-success" : "text-danger"}`}>
              {summary.totalProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(summary.totalProfitLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground text-sm font-semibold">Komposisi Investasi</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={pieData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground text-sm font-semibold">Nilai per Jenis Aset</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)}
                  />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-48">
        <option value="">Semua Jenis</option>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{editingId ? "Edit Investasi" : "Investasi Baru"}</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Nama Aset</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Bank Central Asia" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Simbol (opsional)</Label>
                <Input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="BBCA" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Jenis Investasi</Label>
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Jumlah Unit</Label>
                <Input type="number" min="0" step="any" value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tanggal Pembelian</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Harga Beli Rata-rata</Label>
                <Input type="number" min="0" value={form.avgBuyPrice} onChange={(e) => setForm((f) => ({ ...f, avgBuyPrice: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Harga Saat Ini</Label>
                <Input type="number" min="0" value={form.currentPrice} onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Catatan (opsional)</Label>
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button onClick={handleSave} disabled={saving}>
              {editingId ? "Simpan Perubahan" : "Tambah Investasi"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : investments.length ? (
            investments.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                    {inv.symbol && <Badge variant="outline">{inv.symbol}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[inv.type]} · {inv.units} unit · {formatDate(inv.purchaseDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.currentValue)}</p>
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${inv.profitLoss >= 0 ? "text-success" : "text-danger"}`}>
                      {inv.profitLoss >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {inv.profitLossPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger-soft transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada investasi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
