"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "DEBIT_CARD", label: "Kartu Debit" },
  { value: "CREDIT_CARD", label: "Kartu Kredit" },
  { value: "OTHER", label: "Lainnya" },
];

export function PaymentModal({
  debtId,
  installmentId,
  installmentNo,
  billedAmount,
  onClose,
  onSuccess,
}: {
  debtId: string;
  installmentId: string;
  installmentNo: number;
  billedAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paidAmount, setPaidAmount] = useState(String(billedAmount));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [createTransaction, setCreateTransaction] = useState(true);
  const [overpayStrategy, setOverpayStrategy] = useState<"REDUCE_NEXT" | "EXTRA" | "AUTO_SETTLE_NEXT">("REDUCE_NEXT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paidNum = parseFloat(paidAmount) || 0;
  const isOverpay = paidNum > billedAmount;

  async function handleSubmit(confirmOverpay = false) {
    if (paidNum <= 0) {
      setError("Nominal pembayaran harus lebih besar dari nol");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/debts/${debtId}/installments/${installmentId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: paidNum,
          paymentDate,
          paymentMethod,
          note: note || null,
          overpayStrategy: isOverpay ? overpayStrategy : undefined,
          createTransaction,
          confirmOverpay,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "OVERPAY_CONFIRMATION_REQUIRED") {
          if (confirm(`${data.message}\n\nLanjutkan?`)) {
            return handleSubmit(true);
          }
          setLoading(false);
          return;
        }
        setError(data.error ?? "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      toast.success("Pembayaran berhasil dicatat");
      onSuccess();
    } catch {
      setError("Terjadi kesalahan pada server");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border sticky top-0 bg-card">
          <h3 className="text-sm font-semibold text-foreground">Bayar Cicilan #{installmentNo}</h3>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Sisa tagihan cicilan ini: <span className="font-semibold text-foreground">{formatCurrency(billedAmount)}</span>
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paidAmount">Nominal Dibayar</Label>
            <Input id="paidAmount" type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paymentDate">Tanggal Pembayaran</Label>
            <Input id="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
            <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>

          {isOverpay && (
            <div className="rounded-lg bg-warning-soft p-3 flex flex-col gap-2">
              <p className="text-xs text-warning font-medium">
                Nominal melebihi cicilan bulan ini sebesar {formatCurrency(paidNum - billedAmount)}. Pilih perlakuan:
              </p>
              <Select value={overpayStrategy} onChange={(e) => setOverpayStrategy(e.target.value as typeof overpayStrategy)}>
                <option value="REDUCE_NEXT">Kurangi cicilan bulan berikutnya</option>
                <option value="AUTO_SETTLE_NEXT">Lunasi cicilan berikutnya otomatis</option>
                <option value="EXTRA">Simpan sebagai pembayaran tambahan</option>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan..." />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={createTransaction}
              onChange={(e) => setCreateTransaction(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Buat transaksi otomatis dari pembayaran ini
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button className="flex-1" onClick={() => handleSubmit(false)} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Simpan Pembayaran
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
