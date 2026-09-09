"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/lib/hooks/use-categories-tags";

const REMINDER_OPTIONS = [
  { value: "ON_DUE_DATE", label: "Pada hari jatuh tempo" },
  { value: "ONE_DAY_BEFORE", label: "1 hari sebelumnya" },
  { value: "THREE_DAYS_BEFORE", label: "3 hari sebelumnya" },
  { value: "SEVEN_DAYS_BEFORE", label: "7 hari sebelumnya" },
];

export interface BillFormValues {
  id?: string;
  name: string;
  amount: string;
  categoryId: string;
  dueDate: string;
  reminderOffset: string;
  note: string;
}

export function BillForm({ initial }: { initial?: Partial<BillFormValues> }) {
  const router = useRouter();
  const { categories } = useCategories("EXPENSE");
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [reminderOffset, setReminderOffset] = useState(initial?.reminderOffset ?? "THREE_DAYS_BEFORE");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const payload = {
      name,
      amount: parseFloat(amount),
      categoryId: categoryId || null,
      dueDate,
      reminderOffset,
      note: note || null,
    };

    try {
      const url = initial?.id ? `/api/bills/${initial.id}` : "/api/bills";
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
      toast.success(initial?.id ? "Tagihan berhasil diperbarui" : "Tagihan berhasil ditambahkan");
      router.push("/bills");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama Tagihan</Label>
        <Input id="name" placeholder="Contoh: Listrik" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Nominal</Label>
        <Input id="amount" type="number" min="0" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
          <Label htmlFor="dueDate">Jatuh Tempo</Label>
          <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reminder">Pengingat</Label>
        <Select id="reminder" value={reminderOffset} onChange={(e) => setReminderOffset(e.target.value)}>
          {REMINDER_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan..." />
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
