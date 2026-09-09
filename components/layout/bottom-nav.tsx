"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((item) => item.mobile);
  const [left, right] = [mobileItems.slice(0, 2), mobileItems.slice(2)];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-6 py-4 flex items-center justify-around pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {left.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}

      <Link
        href="/transactions/new"
        className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {right.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  active,
}: {
  item: (typeof import("@/lib/nav-config").NAV_ITEMS)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
