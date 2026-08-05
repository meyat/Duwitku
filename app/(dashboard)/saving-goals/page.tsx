"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Inbox, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatCurrency, safePercentage, daysUntil } from "@/lib/utils";

interface SavingGoalItem {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  status: "ACTIVE" | "ACHIEVED" | "CANCELLED";
}

export default function SavingGoalsPage() {
  const [filter, setFilter] = useState<"ACTIVE" | "ACHIEVED" | "ALL">("ACTIVE");
  const [goals, setGoals] = useState<SavingGoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    fetch(`/api/saving-goals${params}`)
      .then((res) => res.json())
      .then(setGoals)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Target Tabungan</h1>
          <p className="text-sm text-muted-foreground">Wujudkan tujuan finansialmu</p>
        </div>
        <Link href="/saving-goals/new">
          <Button>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </Link>
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[
          { value: "ACTIVE", label: "Aktif" },
          { value: "ACHIEVED", label: "Tercapai" },
          { value: "ALL", label: "Semua" },
        ]}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : goals.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goal) => {
            const pct = Math.min(100, safePercentage(Number(goal.currentAmount), Number(goal.targetAmount)));
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
            const days = goal.deadline ? daysUntil(goal.deadline) : null;

            return (
              <Link key={goal.id} href={`/saving-goals/${goal.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{goal.name}</h3>
                      {goal.status === "ACHIEVED" ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Tercapai
                        </Badge>
                      ) : days !== null ? (
                        <Badge variant={days < 0 ? "danger" : days <= 7 ? "warning" : "default"}>
                          <Clock className="h-3 w-3 mr-1" />
                          {days < 0 ? "Lewat deadline" : `${days} hari lagi`}
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${goal.status === "ACHIEVED" ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    {goal.status === "ACTIVE" && remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Butuh {formatCurrency(remaining)} lagi
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Belum ada target tabungan</p>
            <Link href="/saving-goals/new">
              <Button size="sm" className="mt-2">
                <Plus className="h-4 w-4" /> Buat Target
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
