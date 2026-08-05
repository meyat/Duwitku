"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagWithCount {
  id: string;
  name: string;
  _count: { transactions: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TagWithCount | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadTags() {
    setLoading(true);
    const res = await fetch("/api/tags");
    const data = await res.json();
    setTags(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTags();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(tag: TagWithCount) {
    setEditing(tag);
    setName(tag.name);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Nama tag wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const url = editing ? `/api/tags/${editing.id}` : "/api/tags";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setSaving(false);
        return;
      }
      toast.success(editing ? "Tag diperbarui" : "Tag ditambahkan");
      setShowForm(false);
      await loadTags();
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tag: TagWithCount) {
    if (!confirm(`Hapus tag "${tag.name}"?`)) return;
    try {
      const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus tag");
        return;
      }
      toast.success("Tag dihapus");
      setTags((t) => t.filter((x) => x.id !== tag.id));
    } catch {
      toast.error("Terjadi kesalahan pada server");
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tag</h1>
          <p className="text-sm text-muted-foreground">Kelompokkan transaksi secara fleksibel</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{editing ? "Edit Tag" : "Tag Baru"}</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Darurat" />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button onClick={handleSave} disabled={saving}>
              {editing ? "Simpan Perubahan" : "Tambah Tag"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-20 rounded-full" />
              ))}
            </div>
          ) : tags.length ? (
            <div className="flex flex-col gap-1">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{tag.name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {tag._count.transactions} transaksi
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(tag)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada tag</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
