"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCategories } from "@/lib/hooks/use-categories-tags";

const FREQUENCIES = [
  { value: "DAILY", label: "Harian" },
  { value: "WEEKLY", label: "Mingguan" },
  { value: "MONTHLY", label: "Bulanan" },
  { value: "YEARLY", label: "Tahunan" },
  { value: "CUSTOM", label: "Interval Khusus" },
];

export default function NewRecurringPage() {
  const router = useRouter();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const { categories } = useCategories(type);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [customIntervalDays, setCustomIntervalDays] = useState("30");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          type,
          categoryId: categoryId || null,
          frequency,
          customIntervalDays: frequency === "CUSTOM" ? parseInt(customIntervalDays) : null,
          startDate,
          endDate: endDate || null,
          requireConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setLoading(false);
        return;
      }
      toast.success("Transaksi berulang berhasil dibuat");
      router.push("/recurring");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/recurring" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Transaksi Berulang Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SegmentedControl
          value={type}
          onChange={(v) => setType(v as "INCOME" | "EXPENSE")}
          options={[
            { value: "EXPENSE", label: "Pengeluaran" },
            { value: "INCOME", label: "Pemasukan" },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama</Label>
          <Input id="name" placeholder="Contoh: Langganan Netflix" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Nominal</Label>
          <Input id="amount" type="number" min="0" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="frequency">Frekuensi</Label>
          <Select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </div>

        {frequency === "CUSTOM" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interval">Interval (hari)</Label>
            <Input id="interval" type="number" min="1" value={customIntervalDays} onChange={(e) => setCustomIntervalDays(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">Tanggal Berakhir (opsional)</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={requireConfirmation}
            onChange={(e) => setRequireConfirmation(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Minta konfirmasi sebelum transaksi dibuat otomatis
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
