"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCategories, useTags } from "@/lib/hooks/use-categories-tags";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "DEBIT_CARD", label: "Kartu Debit" },
  { value: "CREDIT_CARD", label: "Kartu Kredit" },
  { value: "OTHER", label: "Lainnya" },
];

export interface TransactionFormValues {
  id?: string;
  title: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  date: string;
  paymentMethod: string;
  note: string;
  tagIds: string[];
}

export function TransactionForm({ initial }: { initial?: Partial<TransactionFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<TransactionFormValues>({
    title: initial?.title ?? "",
    amount: initial?.amount ?? "",
    type: initial?.type ?? "EXPENSE",
    categoryId: initial?.categoryId ?? "",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    paymentMethod: initial?.paymentMethod ?? "CASH",
    note: initial?.note ?? "",
    tagIds: initial?.tagIds ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories(values.type);
  const { tags } = useTags();

  function update<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleTag(tagId: string) {
    setValues((v) => ({
      ...v,
      tagIds: v.tagIds.includes(tagId) ? v.tagIds.filter((t) => t !== tagId) : [...v.tagIds, tagId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const amountNum = parseFloat(values.amount);
    if (!amountNum || amountNum <= 0) {
      setError("Nominal harus lebih besar dari nol");
      return;
    }
    if (!values.title.trim()) {
      setError("Judul wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: values.title,
      amount: amountNum,
      type: values.type,
      categoryId: values.categoryId || null,
      date: values.date,
      paymentMethod: values.paymentMethod,
      note: values.note || null,
      tagIds: values.tagIds,
    };

    try {
      const url = initial?.id ? `/api/transactions/${initial.id}` : "/api/transactions";
      const method = initial?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      toast.success(initial?.id ? "Transaksi berhasil diperbarui" : "Transaksi berhasil ditambahkan");
      router.push("/transactions");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <Label className="mb-1.5 block">Jenis Transaksi</Label>
        <SegmentedControl
          value={values.type}
          onChange={(v) => update("type", v as "INCOME" | "EXPENSE")}
          options={[
            { value: "EXPENSE", label: "Pengeluaran" },
            { value: "INCOME", label: "Pemasukan" },
          ]}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Judul Transaksi</Label>
        <Input
          id="title"
          placeholder="Contoh: Makan siang"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Nominal</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={values.amount}
          onChange={(e) => update("amount", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select
            id="category"
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Tanggal</Label>
          <Input
            id="date"
            type="date"
            value={values.date}
            onChange={(e) => update("date", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
        <Select
          id="paymentMethod"
          value={values.paymentMethod}
          onChange={(e) => update("paymentMethod", e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Tag</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                  values.tagIds.includes(tag.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Input
          id="note"
          placeholder="Tambahkan catatan..."
          value={values.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </div>

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
  );
}
