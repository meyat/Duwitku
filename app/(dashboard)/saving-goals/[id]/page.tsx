"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, safePercentage, daysUntil } from "@/lib/utils";

interface Contribution {
  id: string;
  amount: string;
  note: string | null;
  date: string;
}

interface GoalDetail {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  note: string | null;
  status: "ACTIVE" | "ACHIEVED" | "CANCELLED";
  contributions: Contribution[];
}

export default function SavingGoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/saving-goals/${id}`);
    if (res.ok) setGoal(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleContribute() {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError("Nominal harus lebih besar dari nol");
      return;
    }
    setSaving(true);
    setError(null);

    const signedAmount = mode === "withdraw" ? -num : num;

    try {
      const res = await fetch(`/api/saving-goals/${id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: signedAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setSaving(false);
        return;
      }
      toast.success(mode === "withdraw" ? "Dana berhasil dikurangi" : "Dana berhasil ditambahkan");
      setMode(null);
      setAmount("");
      await load();
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus target tabungan ini? Aksi ini tidak bisa dibatalkan.")) return;
    const res = await fetch(`/api/saving-goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Target tabungan dihapus");
      router.push("/saving-goals");
      router.refresh();
    } else {
      toast.error("Gagal menghapus target tabungan");
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-56 rounded-xl" />
      </div>
    );
  }

  if (!goal) {
    return <p className="text-center text-muted-foreground py-10">Target tabungan tidak ditemukan</p>;
  }

  const pct = Math.min(100, safePercentage(Number(goal.currentAmount), Number(goal.targetAmount)));
  const remaining = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
  const days = goal.deadline ? daysUntil(goal.deadline) : null;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/saving-goals" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{goal.name}</h1>
      </div>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-4">
          {goal.status === "ACHIEVED" && (
            <div className="flex items-center gap-2 rounded-lg bg-success-soft text-success px-3 py-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Target tercapai! 🎉
            </div>
          )}

          <div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${goal.status === "ACHIEVED" ? "bg-success" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-foreground">{pct.toFixed(0)}%</span>
              {days !== null && goal.status === "ACTIVE" && (
                <Badge variant={days < 0 ? "danger" : days <= 7 ? "warning" : "default"}>
                  {days < 0 ? `Lewat ${Math.abs(days)} hari` : `${days} hari lagi`}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Terkumpul</p>
              <p className="text-base font-semibold text-foreground">{formatCurrency(goal.currentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-base font-semibold text-foreground">{formatCurrency(goal.targetAmount)}</p>
            </div>
          </div>

          {remaining > 0 && (
            <p className="text-sm text-muted-foreground">Sisa {formatCurrency(remaining)} lagi untuk tercapai</p>
          )}

          {goal.note && <p className="text-sm text-muted-foreground border-t border-border pt-3">{goal.note}</p>}
        </CardContent>
      </Card>

      {mode ? (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">
              {mode === "add" ? "Tambah Dana" : "Kurangi Dana"}
            </p>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setMode(null); setError(null); }}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleContribute} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setMode("add")}>
            <Plus className="h-4 w-4" /> Tambah Dana
          </Button>
          <Button variant="outline" onClick={() => setMode("withdraw")}>
            <Minus className="h-4 w-4" /> Kurangi Dana
          </Button>
        </div>
      )}

      {goal.contributions.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-semibold text-foreground mb-3">Riwayat Perubahan Dana</p>
            <div className="flex flex-col gap-1">
              {goal.contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                  <span className={`text-sm font-semibold ${Number(c.amount) >= 0 ? "text-success" : "text-danger"}`}>
                    {Number(c.amount) >= 0 ? "+" : ""}
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <button
        onClick={handleDelete}
        className="flex items-center justify-center gap-2 text-sm font-medium text-danger py-2"
      >
        <Trash2 className="h-4 w-4" /> Hapus Target Tabungan
      </button>
    </div>
  );
}
