"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal, Inbox, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTransactionList, DEFAULT_FILTERS, type TransactionFilters } from "@/lib/hooks/use-transaction-list";
import { useCategories, useTags } from "@/lib/hooks/use-categories-tags";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  E_WALLET: "E-Wallet",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  OTHER: "Lainnya",
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const { transactions, pagination, summary, loading } = useTransactionList(filters);
  const { categories } = useCategories();
  const { tags } = useTags();

  function update<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: key === "page" ? (value as number) : 1 }));
  }

  const activeFilterCount = [
    filters.type,
    filters.categoryId,
    filters.tagId,
    filters.paymentMethod,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transaksi</h1>
          <p className="text-sm text-muted-foreground">Riwayat semua transaksimu</p>
        </div>
        <Link href="/transactions/new" className="hidden md:block">
          <Button>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </Link>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau catatan..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((s) => !s)}
          className="shrink-0 relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Jenis</label>
              <Select value={filters.type} onChange={(e) => update("type", e.target.value)}>
                <option value="">Semua jenis</option>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              <Select value={filters.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
                <option value="">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tag</label>
              <Select value={filters.tagId} onChange={(e) => update("tagId", e.target.value)}>
                <option value="">Semua tag</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Metode Pembayaran</label>
              <Select value={filters.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)}>
                <option value="">Semua metode</option>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
              <Input type="date" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
              <Input type="date" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nominal Minimal</label>
              <Input type="number" placeholder="0" value={filters.minAmount} onChange={(e) => update("minAmount", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nominal Maksimal</label>
              <Input type="number" placeholder="0" value={filters.maxAmount} onChange={(e) => update("maxAmount", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Urutkan Berdasarkan</label>
              <Select value={filters.sortBy} onChange={(e) => update("sortBy", e.target.value)}>
                <option value="date">Tanggal</option>
                <option value="amount">Nominal</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Arah Urutan</label>
              <Select value={filters.sortDir} onChange={(e) => update("sortDir", e.target.value)}>
                <option value="desc">Terbaru / Terbesar</option>
                <option value="asc">Terlama / Terkecil</option>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="col-span-full flex items-center justify-center gap-1.5 text-sm text-danger font-medium py-2"
              >
                <X className="h-4 w-4" /> Reset semua filter
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary of active filter results */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Pemasukan</p>
            <p className="text-base font-semibold text-success tabular-nums">
              {formatCurrency(summary.totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
            <p className="text-base font-semibold text-danger tabular-nums">
              {formatCurrency(summary.totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <Card>
        <CardContent className="pt-5 flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg mb-1" />)
          ) : transactions.length ? (
            transactions.map((t) => (
              <Link
                key={t.id}
                href={`/transactions/${t.id}`}
                className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    {t.category?.name ?? "Tanpa kategori"} · {formatDate(t.date)} ·{" "}
                    {PAYMENT_LABELS[t.paymentMethod]}
                    {t.tags.slice(0, 2).map((tt) => (
                      <Badge key={tt.tag.id} variant="outline" className="text-[10px] py-0">
                        {tt.tag.name}
                      </Badge>
                    ))}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ml-3 ${
                    t.type === "INCOME" ? "text-success" : "text-danger"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Tidak ada transaksi ditemukan</p>
              <Link href="/transactions/new">
                <Button size="sm" className="mt-2">
                  <Plus className="h-4 w-4" /> Tambah Transaksi
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} transaksi)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page <= 1}
              onClick={() => update("page", pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => update("page", pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
