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
import { useCategories } from "@/lib/hooks/use-categories-tags";

const REMINDER_OPTIONS = [
  { value: "ON_DUE_DATE", label: "Pada hari jatuh tempo" },
  { value: "ONE_DAY_BEFORE", label: "1 hari sebelumnya" },
  { value: "THREE_DAYS_BEFORE", label: "3 hari sebelumnya" },
  { value: "SEVEN_DAYS_BEFORE", label: "7 hari sebelumnya" },
];

export default function NewBillPage() {
  const router = useRouter();
  const { categories } = useCategories("EXPENSE");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderOffset, setReminderOffset] = useState("THREE_DAYS_BEFORE");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          categoryId: categoryId || null,
          dueDate,
          reminderOffset,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setLoading(false);
        return;
      }
      toast.success("Tagihan berhasil ditambahkan");
      router.push("/bills");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bills" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Tagihan Baru</h1>
      </div>

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
    </div>
  );
}
