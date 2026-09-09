"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  UserPlus,
  MessageCircle,
  Trash2,
  Plus,
  LogOut,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormat } from "@/lib/hooks/use-currency-format";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";
import { formatDate, safePercentage } from "@/lib/utils";
import { MAX_GROUP_MEMBERS } from "@/lib/group-utils";

interface GroupDetail {
  id: string;
  name: string;
  ownerId: string;
  isOwner: boolean;
  members: { id: string; userId: string; status: string; user: { id: string; name: string; email: string } }[];
  stats: { totalBalance: number; monthIncome: number; monthExpense: number };
  recentTransactions: {
    id: string;
    title: string;
    amount: string;
    type: "INCOME" | "EXPENSE";
    date: string;
    user: { name: string };
  }[];
  savingGoals: {
    id: string;
    name: string;
    targetAmount: string;
    status: string;
    contributions: { id: string; amount: string; user: { name: string } }[];
  }[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const formatCurrency = useCurrencyFormat();
  const confirmDialog = useConfirm();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/groups/${id}`);
    if (res.ok) setGroup(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useRefetchOnFocus(load);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/groups/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? "Gagal mengundang");
        setInviting(false);
        return;
      }
      toast.success("Undangan berhasil dikirim");
      setShowInvite(false);
      setInviteEmail("");
      await load();
    } catch {
      setInviteError("Terjadi kesalahan pada server");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, isSelf: boolean) {
    const ok = await confirmDialog({
      title: isSelf ? "Keluar dari grup ini?" : "Keluarkan anggota ini?",
      danger: true,
      confirmLabel: isSelf ? "Keluar" : "Keluarkan",
    });
    if (!ok) return;

    const res = await fetch(`/api/groups/${id}/members/${memberId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal");
      return;
    }
    toast.success(data.message);
    if (isSelf) {
      router.push("/groups");
    } else {
      await load();
    }
  }

  async function handleDeleteGroup() {
    const ok = await confirmDialog({
      title: `Hapus grup "${group?.name}"?`,
      description: "Semua data sharing, target tabungan bersama, dan chat grup akan hilang. Aksi ini tidak bisa dibatalkan.",
      danger: true,
      confirmLabel: "Hapus Grup",
    });
    if (!ok) return;

    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Grup berhasil dihapus");
      router.push("/groups");
    } else {
      toast.error("Gagal menghapus grup");
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoal(true);

    try {
      const res = await fetch(`/api/groups/${id}/saving-goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: goalName, targetAmount: parseFloat(goalTarget) }),
      });
      if (!res.ok) {
        toast.error("Gagal membuat target tabungan");
        return;
      }
      toast.success("Target tabungan bersama dibuat");
      setShowGoalForm(false);
      setGoalName("");
      setGoalTarget("");
      await load();
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleContribute(goalId: string) {
    const amountStr = prompt("Masukkan nominal kontribusi:");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }

    const res = await fetch(`/api/groups/${id}/saving-goals/${goalId}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      toast.success("Kontribusi berhasil ditambahkan");
      await load();
    } else {
      toast.error("Gagal menambah kontribusi");
    }
  }

  if (loading || !group) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  const acceptedMembers = group.members.filter((m) => m.status === "ACCEPTED");
  const pendingMembers = group.members.filter((m) => m.status === "PENDING");
  const currentUserMember = group.members.find((m) => m.status === "ACCEPTED");

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground truncate">{group.name}</h1>
          <p className="text-xs text-muted-foreground">{acceptedMembers.length}/{MAX_GROUP_MEMBERS} anggota</p>
        </div>
        <Link href={`/groups/${id}/chat`}>
          <Button size="sm" variant="outline">
            <MessageCircle className="h-4 w-4" /> Chat
          </Button>
        </Link>
      </div>

      {/* Stats gabungan */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Saldo</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(group.stats.totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Pemasukan Bulan Ini</p>
            <p className="text-sm font-semibold text-success tabular-nums">{formatCurrency(group.stats.monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Pengeluaran Bulan Ini</p>
            <p className="text-sm font-semibold text-danger tabular-nums">{formatCurrency(group.stats.monthExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Anggota */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-foreground text-sm font-semibold">Anggota</CardTitle>
          {group.isOwner && acceptedMembers.length + pendingMembers.length < MAX_GROUP_MEMBERS && (
            <Button size="sm" variant="outline" onClick={() => setShowInvite((s) => !s)}>
              <UserPlus className="h-3.5 w-3.5" /> Undang
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showInvite && (
            <form onSubmit={handleInvite} className="flex flex-col gap-2 pb-3 border-b border-border">
              <Input
                type="email"
                placeholder="Email orang yang mau diundang"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              {inviteError && <p className="text-xs text-danger">{inviteError}</p>}
              <p className="text-xs text-muted-foreground">Orang yang diundang harus sudah punya akun Duwitku.</p>
              <Button type="submit" size="sm" disabled={inviting}>
                {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kirim Undangan
              </Button>
            </form>
          )}

          {acceptedMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {m.user.name} {m.userId === group.ownerId && <Badge variant="primary" className="ml-1">Pemilik</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              {(group.isOwner && m.userId !== group.ownerId) || (!group.isOwner && currentUserMember?.id === m.id) ? (
                <button
                  onClick={() => handleRemoveMember(m.id, currentUserMember?.id === m.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger-soft transition-colors"
                >
                  {currentUserMember?.id === m.id ? (
                    <LogOut className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  )}
                </button>
              ) : null}
            </div>
          ))}

          {pendingMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between opacity-60">
              <div>
                <p className="text-sm font-medium text-foreground">{m.user.name}</p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <Badge variant="warning">Menunggu konfirmasi</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Target tabungan bersama */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-foreground text-sm font-semibold">Target Tabungan Bersama</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowGoalForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" /> Buat
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showGoalForm && (
            <form onSubmit={handleCreateGoal} className="flex flex-col gap-2 pb-3 border-b border-border">
              <Input placeholder="Nama target, contoh: Liburan Bareng" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
              <Input type="number" min="0" placeholder="Nominal target" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} required />
              <Button type="submit" size="sm" disabled={savingGoal}>
                {savingGoal && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Buat Target
              </Button>
            </form>
          )}

          {group.savingGoals.length ? (
            group.savingGoals.map((goal) => {
              const collected = goal.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
              const pct = Math.min(100, safePercentage(collected, Number(goal.targetAmount)));
              return (
                <div key={goal.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{goal.name}</span>
                    <Button size="sm" variant="outline" onClick={() => handleContribute(goal.id)}>
                      <Plus className="h-3 w-3" /> Kontribusi
                    </Button>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(collected)} dari {formatCurrency(goal.targetAmount)} ({pct.toFixed(0)}%)
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada target tabungan bersama</p>
          )}
        </CardContent>
      </Card>

      {/* Transaksi terbaru gabungan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm font-semibold">Transaksi Terbaru (Semua Anggota)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {group.recentTransactions.length ? (
            group.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.user.name} · {formatDate(t.date)}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${t.type === "INCOME" ? "text-success" : "text-danger"}`}>
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi</p>
          )}
        </CardContent>
      </Card>

      {group.isOwner && (
        <button onClick={handleDeleteGroup} className="flex items-center justify-center gap-2 text-sm font-medium text-danger py-2">
          <Trash2 className="h-4 w-4" /> Hapus Grup Ini
        </button>
      )}
    </div>
  );
}
