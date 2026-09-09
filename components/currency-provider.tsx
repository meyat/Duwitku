"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface CurrencyContextValue {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "IDR",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [currency, setCurrencyState] = useState("IDR");

  useEffect(() => {
    if (status !== "authenticated") return;

    const cached = localStorage.getItem("currency");
    if (cached) setCurrencyState(cached);

    fetch("/api/settings/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.currency) {
          setCurrencyState(data.currency);
          localStorage.setItem("currency", data.currency);
        }
      })
      .catch(() => {});
  }, [status]);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
