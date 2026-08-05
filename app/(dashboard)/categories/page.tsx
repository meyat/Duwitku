"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCategories, type CategoryItem } from "@/lib/hooks/use-categories-tags";

const COLOR_OPTIONS = [
  "#25d366", "#3b82f6", "#eab308", "#ef4444", "#9333ea",
  "#f97316", "#06B6D4", "#84CC16", "#EC4899", "#6366F1", "#14B8A6", "#64748B",
];

export default function CategoriesPage() {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const { categories, loading } = useCategories(type);
  const [refreshKey, setRefreshKey] = useState(0);
  const [list, setList] = useState<CategoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(categories);
  }, [categories, refreshKey]);

  function openCreate() {
    setEditing(null);
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setError(null);
    setShowForm(true);
  }

  function openEdit(cat: CategoryItem) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, color, icon: editing?.icon ?? "Circle" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setSaving(false);
        return;
      }
      toast.success(editing ? "Kategori diperbarui" : "Kategori ditambahkan");
      setShowForm(false);
      setRefreshKey((k) => k + 1);
      // Optimistic local update
      if (editing) {
        setList((l) => l.map((c) => (c.id === editing.id ? { ...c, name, color } : c)));
      } else {
        setList((l) => [...l, data]);
      }
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: CategoryItem) {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menghapus kategori");
        return;
      }
      toast.success("Kategori dihapus");
      setList((l) => l.filter((c) => c.id !== cat.id));
    } catch {
      toast.error("Terjadi kesalahan pada server");
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Kategori</h1>
          <p className="text-sm text-muted-foreground">Kelola kategori pemasukan & pengeluaran</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      <SegmentedControl
        value={type}
        onChange={(v) => setType(v as "INCOME" | "EXPENSE")}
        options={[
          { value: "EXPENSE", label: "Pengeluaran" },
          { value: "INCOME", label: "Pemasukan" },
        ]}
      />

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edit Kategori" : "Kategori Baru"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Hobi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button onClick={handleSave} disabled={saving}>
              {editing ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg mb-1" />)
          ) : list.length ? (
            list.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada kategori</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
