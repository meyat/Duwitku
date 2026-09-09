import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  currency = "IDR",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger" | "warning" | "primary";
  currency?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-secondary text-foreground",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    primary: "bg-primary-soft text-primary",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <span className="text-lg font-semibold text-foreground tabular-nums">
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-28 rounded" />
    </div>
  );
}
