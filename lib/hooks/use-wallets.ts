"use client";

import { useEffect, useState } from "react";

export interface WalletItem {
  id: string;
  name: string;
  type: "BANK" | "CASH" | "E_WALLET" | "CREDIT_CARD" | "OTHER";
  bankName: string | null;
  initialBalance: string;
  balance: number;
  color: string;
  isArchived: boolean;
}

export function useWallets(includeArchived = false) {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/wallets${includeArchived ? "?includeArchived=true" : ""}`);
    const data = await res.json();
    setWallets(data.wallets ?? []);
    setTotalBalance(data.totalBalance ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  return { wallets, totalBalance, loading, reload: load };
}
