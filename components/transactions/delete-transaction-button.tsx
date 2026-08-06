"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
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
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex flex-col items-center gap-1.5 rounded-lg border border-danger bg-danger-soft py-3 text-xs font-medium text-danger"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Yakin?
      </button>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      onBlur={() => setConfirming(false)}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-xs font-medium text-danger hover:bg-danger-soft transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Hapus
    </button>
  );
}
