"use client";

import { useEffect, useState } from "react";

export interface DashboardData {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthDiff: number;
  savingsCollected: number;
  dueSoonBillsCount: number;
  totalDebt: number;
  totalReceivable: number;
  totalInvestmentValue: number;
  recentTransactions: Array<{
    id: string;
    title: string;
    amount: string;
    type: "INCOME" | "EXPENSE";
    date: string;
    category: { name: string; icon: string; color: string } | null;
  }>;
  upcomingBills: Array<{
    id: string;
    name: string;
    amount: string;
    dueDate: string;
    status: string;
  }>;
  activeSavingGoals: Array<{
    id: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadline: string | null;
  }>;
  debtSummary: { activeDebtCount: number; activeReceivableCount: number };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Gagal memuat data dashboard");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
