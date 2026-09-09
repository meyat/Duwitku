"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog-provider";

export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Hapus transaksi ini?",
      description: "Aksi ini tidak bisa dibatalkan.",
      danger: true,
      confirmLabel: "Hapus",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Transaksi berhasil dihapus");
      router.push("/transactions");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus transaksi");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-xs font-medium text-danger hover:bg-danger-soft transition-colors"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Hapus
    </button>
  );
}
