"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowLeftRight,
  Shapes,
  Tags,
  Receipt,
  PiggyBank,
  HandCoins,
  LineChart,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SearchResults {
  transactions: { id: string; title: string; amount: string; type: string }[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  bills: { id: string; name: string; amount: string }[];
  savingGoals: { id: string; name: string }[];
  debts: { id: string; title: string; counterpartyName: string }[];
  investments: { id: string; name: string; symbol: string | null }[];
}

const EMPTY_RESULTS: SearchResults = {
  transactions: [],
  categories: [],
  tags: [],
  bills: [],
  savingGoals: [],
  debts: [],
  investments: [],
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    }
    function handleCustomOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-global-search", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-global-search", handleCustomOpen);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then(setResults)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function go(path: string) {
    router.push(path);
    close();
  }

  if (!open) return null;

  const hasResults =
    results.transactions.length ||
    results.categories.length ||
    results.tags.length ||
    results.bills.length ||
    results.savingGoals.length ||
    results.debts.length ||
    results.investments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40" onClick={close}>
      <div
        className="w-full max-w-xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari transaksi, tagihan, target tabungan..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={close}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading && <p className="text-xs text-muted-foreground text-center py-6">Mencari...</p>}

          {!loading && query && !hasResults && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada hasil untuk &quot;{query}&quot;
            </p>
          )}

          {!loading && !query && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ketik untuk mencari di seluruh data keuanganmu
            </p>
          )}

          <ResultGroup
            icon={ArrowLeftRight}
            label="Transaksi"
            items={results.transactions.map((t) => ({
              id: t.id,
              primary: t.title,
              secondary: formatCurrency(t.amount),
              path: `/transactions/${t.id}`,
            }))}
            onSelect={go}
          />
          <ResultGroup
            icon={Shapes}
            label="Kategori"
            items={results.categories.map((c) => ({ id: c.id, primary: c.name, path: "/categories" }))}
            onSelect={go}
          />
          <ResultGroup
            icon={Tags}
            label="Tag"
            items={results.tags.map((t) => ({ id: t.id, primary: t.name, path: "/tags" }))}
            onSelect={go}
          />
          <ResultGroup
            icon={Receipt}
            label="Tagihan"
            items={results.bills.map((b) => ({
              id: b.id,
              primary: b.name,
              secondary: formatCurrency(b.amount),
              path: "/bills",
            }))}
            onSelect={go}
          />
          <ResultGroup
            icon={PiggyBank}
            label="Target Tabungan"
            items={results.savingGoals.map((g) => ({ id: g.id, primary: g.name, path: "/saving-goals" }))}
            onSelect={go}
          />
          <ResultGroup
            icon={HandCoins}
            label="Utang & Piutang"
            items={results.debts.map((d) => ({
              id: d.id,
              primary: d.title,
              secondary: d.counterpartyName,
              path: `/debts/${d.id}`,
            }))}
            onSelect={go}
          />
          <ResultGroup
            icon={LineChart}
            label="Investasi"
            items={results.investments.map((i) => ({
              id: i.id,
              primary: i.name,
              secondary: i.symbol ?? undefined,
              path: "/investments",
            }))}
            onSelect={go}
          />
        </div>
      </div>
    </div>
  );
}

function ResultGroup({
  icon: Icon,
  label,
  items,
  onSelect,
}: {
  icon: React.ElementType;
  label: string;
  items: { id: string; primary: string; secondary?: string; path: string }[];
  onSelect: (path: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="mb-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1.5">
        {label}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.path)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary text-left transition-colors"
        >
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{item.primary}</span>
          {item.secondary && <span className="text-xs text-muted-foreground shrink-0">{item.secondary}</span>}
        </button>
      ))}
    </div>
  );
}
