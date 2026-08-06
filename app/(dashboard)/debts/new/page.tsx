"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, calculateAutomaticInstallments } from "@/lib/utils";

interface ManualRow {
  dueDate: string;
  billedAmount: string;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "DEBIT_CARD", label: "Kartu Debit" },
  { value: "CREDIT_CARD", label: "Kartu Kredit" },
  { value: "OTHER", label: "Lainnya" },
];

export default function NewDebtPage() {
  const router = useRouter();
  const [type, setType] = useState<"DEBT" | "RECEIVABLE">("DEBT");
  const [system, setSystem] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC");

  const [title, setTitle] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [downPayment, setDownPayment] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");

  // Automatic mode
  const [months, setMonths] = useState("12");
  const [firstPaymentDate, setFirstPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  // Manual mode
  const [manualRows, setManualRows] = useState<ManualRow[]>([{ dueDate: "", billedAmount: "" }]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalNum = parseFloat(totalAmount) || 0;
  const dpNum = parseFloat(downPayment) || 0;
  const remainingAfterDp = Math.max(0, totalNum - dpNum);

  const autoPreview = useMemo(() => {
    const m = parseInt(months) || 0;
    if (totalNum <= 0 || m <= 0) return [];
    return calculateAutomaticInstallments(totalNum, dpNum, m);
  }, [totalNum, dpNum, months]);

  const manualTotal = manualRows.reduce((sum, r) => sum + (parseFloat(r.billedAmount) || 0), 0);
  const manualDiff = remainingAfterDp - manualTotal;

  function addManualRow() {
    setManualRows((rows) => [...rows, { dueDate: "", billedAmount: "" }]);
  }
  function removeManualRow(index: number) {
    setManualRows((rows) => rows.filter((_, i) => i !== index));
  }
  function updateManualRow(index: number, field: keyof ManualRow, value: string) {
    setManualRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent, confirmOverage = false) {
    e.preventDefault();
    if (loading) return;

    if (!title.trim() || !counterpartyName.trim()) {
      setError("Judul dan nama pihak terkait wajib diisi");
      return;
    }
    if (totalNum <= 0) {
      setError("Total nominal harus lebih besar dari nol");
      return;
    }
    if (dpNum > totalNum) {
      setError("Uang muka tidak boleh melebihi total nominal");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title,
      counterpartyName,
      type,
      totalAmount: totalNum,
      startDate,
      dueDate: dueDate || null,
      contactNumber: contactNumber || null,
      note: note || null,
      paymentMethod,
      installmentSystem: system,
      downPayment: dpNum,
    };

    if (system === "AUTOMATIC") {
      payload.months = parseInt(months);
      payload.firstPaymentDate = firstPaymentDate;
    } else {
      const invalidRow = manualRows.some((r) => !r.dueDate || !r.billedAmount || parseFloat(r.billedAmount) <= 0);
      if (invalidRow) {
        setError("Setiap baris cicilan manual wajib memiliki tanggal dan nominal valid");
        setLoading(false);
        return;
      }
      payload.manualInstallments = manualRows.map((r) => ({
        dueDate: r.dueDate,
        billedAmount: parseFloat(r.billedAmount),
      }));
      if (confirmOverage) payload.confirmOverage = true;
    }

    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "OVERAGE_CONFIRMATION_REQUIRED") {
          if (confirm(`${data.message}\n\nLanjutkan simpan?`)) {
            return handleSubmit(e, true);
          }
          setLoading(false);
          return;
        }
        setError(data.error ?? "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      toast.success(`${type === "DEBT" ? "Utang" : "Piutang"} berhasil ditambahkan`);
      router.push(`/debts/${data.id}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/debts" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Utang/Piutang Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SegmentedControl
          value={type}
          onChange={(v) => setType(v as "DEBT" | "RECEIVABLE")}
          options={[
            { value: "DEBT", label: "Utang (saya berutang)" },
            { value: "RECEIVABLE", label: "Piutang (dipinjam orang)" },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul</Label>
          <Input id="title" placeholder="Contoh: Cicilan Laptop" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="counterparty">Nama Pihak Terkait</Label>
          <Input
            id="counterparty"
            placeholder="Contoh: Toko Elektronik Jaya"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="total">Total Nominal</Label>
            <Input id="total" type="number" min="0" placeholder="0" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dp">Uang Muka (opsional)</Label>
            <Input id="dp" type="number" min="0" placeholder="0" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Jatuh Tempo (opsional)</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact">Nomor Kontak (opsional)</Label>
          <Input id="contact" placeholder="08xxxxxxxxxx" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm">Metode Pembayaran</Label>
          <Select id="pm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>

        {/* Sistem Pembayaran - segmented control seperti spec */}
        <div>
          <Label className="mb-1.5 block">Sistem Pembayaran</Label>
          <SegmentedControl
            value={system}
            onChange={(v) => setSystem(v as "AUTOMATIC" | "MANUAL")}
            options={[
              { value: "AUTOMATIC", label: "Cicilan Otomatis" },
              { value: "MANUAL", label: "Cicilan Manual" },
            ]}
            className="w-full"
          />
        </div>

        {system === "AUTOMATIC" ? (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="months">Jumlah Bulan</Label>
                  <Input id="months" type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstPayment">Pembayaran Pertama</Label>
                  <Input
                    id="firstPayment"
                    type="date"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {autoPreview.length > 0 && (
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Cicilan per bulan (± sesuai pembulatan di bulan terakhir)
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(autoPreview[0])} × {autoPreview.length} bulan
                  </p>
                  {autoPreview[autoPreview.length - 1] !== autoPreview[0] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cicilan terakhir: {formatCurrency(autoPreview[autoPreview.length - 1])}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-3">
              {manualRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1.5 flex-1">
                    {i === 0 && <Label className="text-xs">Tanggal Jatuh Tempo</Label>}
                    <Input type="date" value={row.dueDate} onChange={(e) => updateManualRow(i, "dueDate", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {i === 0 && <Label className="text-xs">Nominal</Label>}
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.billedAmount}
                      onChange={(e) => updateManualRow(i, "billedAmount", e.target.value)}
                    />
                  </div>
                  {manualRows.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeManualRow(i)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addManualRow}>
                <Plus className="h-4 w-4" /> Tambah Baris
              </Button>

              {totalNum > 0 && (
                <div
                  className={`rounded-lg p-3 text-xs ${
                    manualDiff === 0
                      ? "bg-success-soft text-success"
                      : manualDiff > 0
                        ? "bg-warning-soft text-warning"
                        : "bg-danger-soft text-danger"
                  }`}
                >
                  Total jadwal: {formatCurrency(manualTotal)} dari {formatCurrency(remainingAfterDp)} (sisa
                  setelah uang muka) —{" "}
                  {manualDiff === 0
                    ? "sudah pas"
                    : manualDiff > 0
                      ? `masih kurang ${formatCurrency(manualDiff)}`
                      : `melebihi ${formatCurrency(Math.abs(manualDiff))}`}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
