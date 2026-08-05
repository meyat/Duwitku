"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Check, Wallet, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, safePercentage, daysUntil } from "@/lib/utils";
import { PaymentModal } from "@/components/debts/payment-modal";

interface Payment {
  id: string;
  paidAmount: string;
  paymentDate: string;
  paymentMethod: string;
  note: string | null;
}

interface Installment {
  id: string;
  installmentNo: number;
  dueDate: string;
  billedAmount: string;
  paidAmount: string;
  status: string;
  payments: Payment[];
}

interface DebtDetail {
  id: string;
  title: string;
  counterpartyName: string;
  type: "DEBT" | "RECEIVABLE";
  totalAmount: string;
  downPayment: string;
  startDate: string;
  dueDate: string | null;
  contactNumber: string | null;
  note: string | null;
  status: string;
  installmentSystem: string;
  installments: Installment[];
  totalPaid: number;
  remaining: number;
  completedInstallments: number;
  pendingInstallments: number;
}

const INSTALLMENT_STATUS_STYLE: Record<string, { badge: "default" | "success" | "warning" | "danger"; label: string }> = {
  UNPAID: { badge: "default", label: "Belum Dibayar" },
  PARTIALLY_PAID: { badge: "warning", label: "Dibayar Sebagian" },
  PAID: { badge: "success", label: "Sudah Dibayar" },
  LATE: { badge: "danger", label: "Terlambat" },
  SKIPPED: { badge: "default", label: "Dilewati" },
  CANCELLED: { badge: "default", label: "Dibatalkan" },
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  NOT_STARTED: "Belum Mulai",
  PARTIALLY_PAID: "Dibayar Sebagian",
  PAID_OFF: "Lunas",
  LATE: "Terlambat",
  CANCELLED: "Dibatalkan",
};

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/debts/${id}`);
    if (res.ok) setDebt(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!confirm("Hapus data utang/piutang ini beserta seluruh riwayat cicilannya?")) return;
    const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Data berhasil dihapus");
      router.push("/debts");
      router.refresh();
    } else {
      toast.error("Gagal menghapus data");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-56 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!debt) {
    return <p className="text-center text-muted-foreground py-10">Data tidak ditemukan</p>;
  }

  const pct = Math.min(100, safePercentage(debt.totalPaid, Number(debt.totalAmount)));
  const days = debt.dueDate ? daysUntil(debt.dueDate) : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/debts" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{debt.title}</h1>
          <p className="text-xs text-muted-foreground">{debt.counterpartyName}</p>
        </div>
        <Badge variant={debt.status === "PAID_OFF" ? "success" : debt.status === "LATE" ? "danger" : "primary"} className="ml-auto shrink-0">
          {STATUS_LABEL[debt.status]}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-5 flex flex-col gap-4">
          <div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${debt.type === "DEBT" ? "bg-danger" : "bg-success"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-foreground">{pct.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(debt.totalPaid)} dari {formatCurrency(debt.totalAmount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Sisa Pembayaran</p>
              <p className="text-base font-semibold text-foreground">{formatCurrency(debt.remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cicilan Selesai</p>
              <p className="text-base font-semibold text-foreground">
                {debt.completedInstallments} / {debt.installments.length}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Mulai {formatDate(debt.startDate)}
              {debt.dueDate && ` · Jatuh tempo ${formatDate(debt.dueDate)}`}
              {days !== null && days >= 0 && ` (${days} hari lagi)`}
            </div>
            {debt.contactNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {debt.contactNumber}
              </div>
            )}
            {Number(debt.downPayment) > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Uang muka {formatCurrency(debt.downPayment)}
              </div>
            )}
          </div>

          {debt.note && <p className="text-sm text-muted-foreground border-t border-border pt-3">{debt.note}</p>}
        </CardContent>
      </Card>

      {/* Installment timeline */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-semibold text-foreground mb-3">Daftar Cicilan</p>
          <div className="flex flex-col gap-3">
            {debt.installments.map((inst) => {
              const style = INSTALLMENT_STATUS_STYLE[inst.status] ?? INSTALLMENT_STATUS_STYLE.UNPAID;
              const remaining = Math.max(0, Number(inst.billedAmount) - Number(inst.paidAmount));
              const canPay = inst.status !== "PAID" && inst.status !== "CANCELLED" && inst.status !== "SKIPPED";

              return (
                <div key={inst.id} className="rounded-lg border border-border p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Cicilan {inst.installmentNo} — {formatDate(inst.dueDate)}
                    </p>
                    <Badge variant={style.badge}>{style.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tagihan: {formatCurrency(inst.billedAmount)}</span>
                    <span>Dibayar: {formatCurrency(inst.paidAmount)}</span>
                    {remaining > 0 && <span>Sisa: {formatCurrency(remaining)}</span>}
                  </div>
                  {canPay && (
                    <Button size="sm" variant="success" onClick={() => setPayingInstallment(inst)} className="self-start mt-1">
                      <Check className="h-3.5 w-3.5" /> Input Pembayaran
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleDelete}
        className="flex items-center justify-center gap-2 text-sm font-medium text-danger py-2"
      >
        <Trash2 className="h-4 w-4" /> Hapus Data Ini
      </button>

      {payingInstallment && (
        <PaymentModal
          debtId={debt.id}
          installmentId={payingInstallment.id}
          installmentNo={payingInstallment.installmentNo}
          billedAmount={Number(payingInstallment.billedAmount) - Number(payingInstallment.paidAmount)}
          onClose={() => setPayingInstallment(null)}
          onSuccess={() => {
            setPayingInstallment(null);
            load();
          }}
        />
      )}
    </div>
  );
}
