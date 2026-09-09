"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Users2, Inbox, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";

interface GroupMemberInfo {
  id: string;
  status: string;
  user: { id: string; name: string; email: string };
}

interface GroupItem {
  id: string;
  name: string;
  ownerId: string;
  members: GroupMemberInfo[];
}

interface InviteItem {
  id: string;
  groupId: string;
  group: { id: string; name: string; owner: { name: string; email: string } };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [groupsRes, invitesRes] = await Promise.all([
      fetch("/api/groups"),
      fetch("/api/groups/invites"),
    ]);
    setGroups(await groupsRes.json());
    setInvites(await invitesRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useRefetchOnFocus(load);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Nama grup wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setSaving(false);
        return;
      }
      toast.success("Grup berhasil dibuat");
      setShowForm(false);
      setName("");
      await load();
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(invite: InviteItem, action: "ACCEPT" | "DECLINE") {
    setRespondingId(invite.id);
    try {
      const res = await fetch(`/api/groups/${invite.groupId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error("Gagal merespon undangan");
        return;
      }
      toast.success(action === "ACCEPT" ? "Undangan diterima!" : "Undangan ditolak");
      await load();
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Grup Sharing</h1>
          <p className="text-sm text-muted-foreground">Berbagi data keuangan dengan orang terdekat (maks 5 orang)</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Buat Grup
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 flex flex-col gap-3">
            <Input placeholder="Nama grup, contoh: Keluarga Kecil" value={name} onChange={(e) => setName(e.target.value)} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Buat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {invites.length > 0 && (
        <Card className="border-warning/30">
          <CardContent className="pt-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Undangan Menunggu Konfirmasi</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.group.name}</p>
                  <p className="text-xs text-muted-foreground">Diundang oleh {inv.group.owner.name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleRespond(inv, "ACCEPT")}
                    disabled={respondingId === inv.id}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(inv, "DECLINE")}
                    disabled={respondingId === inv.id}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : groups.length ? (
            groups.map((g) => {
              const accepted = g.members.filter((m) => m.status === "ACCEPTED");
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Users2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{accepted.length} anggota</p>
                    </div>
                  </div>
                  {g.ownerId && <Badge variant="outline">{accepted.length}/5</Badge>}
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Belum ada grup. Buat grup buat mulai sharing data sama temen/keluarga.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
