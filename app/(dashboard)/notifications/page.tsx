"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCheck, Trash2, Inbox, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    await fetch("/api/notifications/generate", { method: "POST" });
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    toast.success("Semua notifikasi ditandai sudah dibaca");
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((n) => n.filter((x) => x.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" /> Tandai Semua
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg mb-1" />)
          ) : notifications.length ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 py-3 border-b border-border last:border-0 ${!n.isRead ? "bg-accent/40 -mx-2 px-2 rounded-lg" : ""}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${!n.isRead ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link href={n.link} onClick={() => !n.isRead && handleMarkRead(n.id)}>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                      title="Tandai dibaca"
                    >
                      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-danger/10 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
