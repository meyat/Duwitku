"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

export function Topbar({ userName }: { userName: string }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-4 md:px-6 gap-4">
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
        className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-3 py-2 w-full max-w-xs hover:bg-secondary/70 transition-colors cursor-text"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Cari transaksi, tagihan...</span>
        <span className="sm:hidden">Cari...</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] bg-card border border-border rounded px-1.5 py-0.5">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      <div className="flex items-center gap-3 shrink-0">
        <NotificationDropdown />
        <Link
          href="/settings"
          className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{userName}</span>
        </Link>
      </div>
    </header>
  );
}
