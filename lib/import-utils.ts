import crypto from "crypto";

export interface RawImportRow {
  title?: string;
  amount?: string;
  type?: string;
  category?: string;
  date?: string;
  paymentMethod?: string;
  tags?: string;
  note?: string;
}

export interface ValidatedImportRow {
  rowIndex: number;
  title: string;
  amount: number | null;
  type: "INCOME" | "EXPENSE" | null;
  categoryName: string | null;
  date: Date | null;
  paymentMethod: string;
  tags: string[];
  note: string | null;
  isValid: boolean;
  errors: string[];
  rowHash: string;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  tunai: "CASH",
  cash: "CASH",
  "transfer bank": "BANK_TRANSFER",
  transfer: "BANK_TRANSFER",
  "e-wallet": "E_WALLET",
  ewallet: "E_WALLET",
  "kartu debit": "DEBIT_CARD",
  debit: "DEBIT_CARD",
  "kartu kredit": "CREDIT_CARD",
  kredit: "CREDIT_CARD",
  lainnya: "OTHER",
};

function parseType(raw?: string): "INCOME" | "EXPENSE" | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (["pemasukan", "income", "masuk"].includes(normalized)) return "INCOME";
  if (["pengeluaran", "expense", "keluar"].includes(normalized)) return "EXPENSE";
  return null;
}

function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned || raw);
  return isNaN(num) ? null : num;
}

function parseDateWithFormat(raw: string | undefined, format: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  let day: number, month: number, year: number;

  if (format === "YYYY-MM-DD") {
    const [y, m, d] = trimmed.split(/[-/]/).map(Number);
    [year, month, day] = [y, m, d];
  } else if (format === "MM/DD/YYYY") {
    const [m, d, y] = trimmed.split(/[-/]/).map(Number);
    [month, day, year] = [m, d, y];
  } else {
    // DD/MM/YYYY default
    const [d, m, y] = trimmed.split(/[-/]/).map(Number);
    [day, month, year] = [d, m, y];
  }

  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function validateImportRow(
  raw: RawImportRow,
  rowIndex: number,
  dateFormat: string
): ValidatedImportRow {
  const errors: string[] = [];

  const title = (raw.title ?? "").trim();
  if (!title) errors.push("Judul wajib diisi");

  const amount = parseAmount(raw.amount);
  if (amount === null || amount <= 0) errors.push("Nominal harus berupa angka positif");

  const type = parseType(raw.type);
  if (!type) errors.push("Jenis transaksi harus 'Pemasukan' atau 'Pengeluaran'");

  const date = parseDateWithFormat(raw.date, dateFormat);
  if (!date) errors.push("Format tanggal tidak valid");

  const paymentMethodRaw = (raw.paymentMethod ?? "").trim().toLowerCase();
  const paymentMethod = PAYMENT_METHOD_MAP[paymentMethodRaw] ?? "OTHER";

  const tags = (raw.tags ?? "")
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean);

  const rowHash = crypto
    .createHash("md5")
    .update(`${title}|${amount}|${type}|${date?.toISOString().slice(0, 10)}`)
    .digest("hex");

  return {
    rowIndex,
    title,
    amount,
    type,
    categoryName: raw.category?.trim() || null,
    date,
    paymentMethod,
    tags,
    note: raw.note?.trim() || null,
    isValid: errors.length === 0,
    errors,
    rowHash,
  };
}
