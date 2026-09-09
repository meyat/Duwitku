"use client";

import { useCurrency } from "@/components/currency-provider";
import { formatCurrency } from "@/lib/utils";

/**
 * Return fungsi format currency yang otomatis pakai mata uang sesuai
 * preferensi user (bukan selalu IDR hardcoded).
 */
export function useCurrencyFormat() {
  const { currency } = useCurrency();
  return (amount: number | string) => formatCurrency(amount, currency);
}
