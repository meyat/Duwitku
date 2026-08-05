import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<string, string> = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  SGD: "en-SG",
  MYR: "ms-MY",
};

/**
 * Format nominal uang. IDR tidak menampilkan desimal kecuali diperlukan.
 */
export function formatCurrency(amount: number | string, currency: string = "IDR") {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = CURRENCY_LOCALE[currency] ?? "id-ID";

  const hasDecimal = value % 1 !== 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "IDR" && !hasDecimal ? 0 : 2,
    maximumFractionDigits: currency === "IDR" && !hasDecimal ? 0 : 2,
  }).format(value);
}

export function formatDate(date: Date | string, format: string = "DD/MM/YYYY") {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Hitung persentase dengan aman terhadap pembagian nol.
 */
export function safePercentage(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Hitung sisa hari menuju deadline. Negatif berarti sudah lewat.
 */
export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Hitung jadwal cicilan otomatis. Selisih pembulatan dimasukkan ke cicilan terakhir.
 */
export function calculateAutomaticInstallments(
  totalAmount: number,
  downPayment: number,
  months: number
): number[] {
  const remaining = totalAmount - downPayment;
  const baseInstallment = Math.floor(remaining / months);
  const installments = Array(months).fill(baseInstallment);

  const totalAllocated = baseInstallment * months;
  const remainder = remaining - totalAllocated;
  installments[months - 1] += remainder;

  return installments;
}
