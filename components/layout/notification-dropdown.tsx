"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Inbox, CheckCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadCount() {
    try {
      const res = await fetch("/api/notifications/generate", { method: "POST" }).catch(() => null);
      void res;
      const listRes = await fetch("/api/notifications");
      const data = await listRes.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // diam-diam gagal, badge tetap 0
    }
  }

  useEffect(() => {
    loadCount();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications((data.notifications ?? []).slice(0, 5));
      setUnreadCount(data.unreadCount ?? 0);
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-xl shadow-2xl z-50 dropdown-pop overflow-hidden">
          <div className="flex items-center justify-between px-4 h-11 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifikasi</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="h-3 w-3" /> Tandai semua
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : notifications.length ? (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/notifications"}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${
                    !n.isRead ? "bg-accent" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(n.createdAt)}</p>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Tidak ada notifikasi</p>
              </div>
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-primary py-2.5 border-t border-border hover:bg-secondary/50 transition-colors"
          >
            Lihat Semua Notifikasi
          </Link>
        </div>
      )}
    </div>
  );
}
