"use client";

import { useEffect, useState, useCallback } from "react";

export interface TransactionFilters {
  page: number;
  search: string;
  type: string;
  categoryId: string;
  tagId: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortDir: string;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  page: 1,
  search: "",
  type: "",
  categoryId: "",
  tagId: "",
  paymentMethod: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  sortBy: "date",
  sortDir: "desc",
};

export interface TransactionListItem {
  id: string;
  title: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  date: string;
  paymentMethod: string;
  note: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  tags: { tag: { id: string; name: string } }[];
}

export function useTransactionList(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 });
      setSummary(data.summary ?? { totalIncome: 0, totalExpense: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, pagination, summary, loading, reload: load };
}
