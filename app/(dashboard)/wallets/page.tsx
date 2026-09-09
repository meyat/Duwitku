"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Inbox, Archive, ArchiveRestore } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useWallets, type WalletItem } from "@/lib/hooks/use-wallets";
import { useCurrencyFormat } from "@/lib/hooks/use-currency-format";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { WALLET_TYPE_LABEL, WALLET_TYPE_ICON } from "@/lib/wallet-utils";
import { BANK_PRESETS } from "@/lib/validations-wallet";

const COLOR_OPTIONS = [
  "#25d366", "#3b82f6", "#eab308", "#ef4444", "#9333ea",
  "#f97316", "#06B6D4", "#84CC16", "#EC4899", "#6366F1",
];

const EMPTY_FORM = {
  name: "",
  type: "BANK" as const,
  bankName: BANK_PRESETS[0],
  initialBalance: "0",
  color: COLOR_OPTIONS[0],
};

export default function WalletsPage() {
  const { wallets, totalBalance, loading, reload } = useWallets(true);
  const formatCurrency = useCurrencyFormat();
  const confirmDialog = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    type: "BANK" | "CASH" | "E_WALLET" | "CREDIT_CARD" | "OTHER";
    bankName: string;
    initialBalance: string;
    color: string;
  }>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(w: WalletItem) {
    setEditingId(w.id);
    setForm({
      name: w.name,
      type: w.type,
      bankName: w.bankName ?? BANK_PRESETS[0],
      initialBalance: w.initialBalance,
      color: w.color,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Nama wallet wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      type: form.type,
      bankName: form.type === "BANK" ? form.bankName : null,
      initialBalance: parseFloat(form.initialBalance) || 0,
      color: form.color,
    };

    try {
      const url = editingId ? `/api/wallets/${editingId}` : "/api/wallets";
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
      toast.success(editingId ? "Wallet diperbarui" : "Wallet ditambahkan");
      setShowForm(false);
      await reload();
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(w: WalletItem) {
    const ok = await confirmDialog({
      title: `Hapus wallet "${w.name}"?`,
      description: "Aksi ini tidak bisa dibatalkan.",
      danger: true,
      confirmLabel: "Hapus",
    });
    if (!ok) return;

    const res = await fetch(`/api/wallets/${w.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menghapus wallet");
      return;
    }
    toast.success("Wallet dihapus");
    await reload();
  }

  async function handleToggleArchive(w: WalletItem) {
    const res = await fetch(`/api/wallets/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !w.isArchived }),
    });
    if (res.ok) {
      toast.success(w.isArchived ? "Wallet diaktifkan lagi" : "Wallet diarsipkan");
      await reload();
    }
  }

  const activeWallets = wallets.filter((w) => !w.isArchived);
  const archivedWallets = wallets.filter((w) => w.isArchived);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground">Kelola sumber dana kamu secara terpisah</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Total Saldo Semua Wallet</p>
          <p className="text-xl font-semibold text-foreground tabular-nums">
            {loading ? "..." : formatCurrency(totalBalance)}
          </p>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editingId ? "Edit Wallet" : "Wallet Baru"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Jenis Wallet</Label>
              <SegmentedControl
                value={form.type}
                onChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}
                options={[
                  { value: "BANK", label: "Bank" },
                  { value: "CASH", label: "Tunai" },
                  { value: "E_WALLET", label: "E-Wallet" },
                  { value: "CREDIT_CARD", label: "Kartu Kredit" },
                ]}
              />
            </div>

            {form.type === "BANK" && (
              <div className="flex flex-col gap-1.5">
                <Label>Nama Bank</Label>
                <Select value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}>
                  {BANK_PRESETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Nama Wallet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={form.type === "BANK" ? "Contoh: BCA Utama" : "Contoh: Dompet Harian"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Saldo Awal</Label>
              <Input
                type="number"
                min="0"
                value={form.initialBalance}
                onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-7 w-7 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button onClick={handleSave} disabled={saving}>
              {editingId ? "Simpan Perubahan" : "Tambah Wallet"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : activeWallets.length ? (
            activeWallets.map((w) => {
              const Icon = WALLET_TYPE_ICON[w.type];
              return (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${w.color}26` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: w.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.type === "BANK" ? w.bankName : WALLET_TYPE_LABEL[w.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-sm font-semibold tabular-nums ${w.balance < 0 ? "text-danger" : "text-foreground"}`}>
                      {formatCurrency(w.balance)}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(w)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleToggleArchive(w)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors" title="Arsipkan">
                        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(w)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger-soft transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada wallet. Tambah dulu biar bisa milih pas nambah transaksi.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {archivedWallets.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Wallet Diarsipkan</p>
            <div className="flex flex-col gap-1">
              {archivedWallets.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 opacity-60">
                  <p className="text-sm text-foreground">{w.name}</p>
                  <button onClick={() => handleToggleArchive(w)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors" title="Aktifkan lagi">
                    <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
