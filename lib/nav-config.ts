import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Tags,
  Shapes,
  PiggyBank,
  Receipt,
  Repeat,
  HandCoins,
  LineChart,
  ArrowDownUp,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  mobile?: boolean; // show in bottom nav
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight, mobile: true },
  { label: "Statistik", href: "/statistics", icon: BarChart3, mobile: true },
  { label: "Kategori", href: "/categories", icon: Shapes },
  { label: "Tag", href: "/tags", icon: Tags },
  { label: "Target Tabungan", href: "/saving-goals", icon: PiggyBank },
  { label: "Tagihan", href: "/bills", icon: Receipt },
  { label: "Transaksi Berulang", href: "/recurring", icon: Repeat },
  { label: "Utang & Piutang", href: "/debts", icon: HandCoins },
  { label: "Investasi", href: "/investments", icon: LineChart },
  { label: "Import & Export", href: "/import-export", icon: ArrowDownUp },
  { label: "Notifikasi", href: "/notifications", icon: Bell, mobile: true },
  { label: "Pengaturan", href: "/settings", icon: Settings, mobile: true },
];
