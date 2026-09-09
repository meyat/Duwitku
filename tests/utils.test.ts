import { describe, it, expect } from "vitest";
import { safePercentage, calculateAutomaticInstallments, daysUntil, formatCurrency } from "../lib/utils";

describe("safePercentage", () => {
  it("menghitung persentase dengan benar", () => {
    expect(safePercentage(50, 200)).toBe(25);
  });

  it("mengembalikan 0 jika pembagi nol (hindari division by zero)", () => {
    expect(safePercentage(50, 0)).toBe(0);
  });

  it("mengembalikan 0 jika pembagi undefined-like (NaN guard)", () => {
    expect(safePercentage(0, 0)).toBe(0);
  });
});

describe("calculateAutomaticInstallments", () => {
  it("membagi rata cicilan ketika habis dibagi", () => {
    const result = calculateAutomaticInstallments(12_000_000, 0, 12);
    expect(result).toHaveLength(12);
    expect(result.every((v) => v === 1_000_000)).toBe(true);
    expect(result.reduce((a, b) => a + b, 0)).toBe(12_000_000);
  });

  it("memasukkan sisa pembulatan ke cicilan terakhir", () => {
    const result = calculateAutomaticInstallments(10_000_000, 0, 3);
    // 10,000,000 / 3 = 3,333,333.33 -> base 3,333,333 x2 + sisa di terakhir
    expect(result[0]).toBe(3_333_333);
    expect(result[1]).toBe(3_333_333);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10_000_000);
  });

  it("memperhitungkan uang muka sebelum membagi cicilan", () => {
    const result = calculateAutomaticInstallments(12_000_000, 2_000_000, 10);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10_000_000);
    expect(result).toHaveLength(10);
  });

  it("total cicilan selalu sama dengan total nominal dikurangi uang muka", () => {
    const total = 7_777_777;
    const dp = 777_777;
    const months = 7;
    const result = calculateAutomaticInstallments(total, dp, months);
    expect(result.reduce((a, b) => a + b, 0)).toBe(total - dp);
  });
});

describe("daysUntil", () => {
  it("mengembalikan angka positif untuk tanggal di masa depan", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntil(future)).toBe(5);
  });

  it("mengembalikan angka negatif untuk tanggal yang sudah lewat", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysUntil(past)).toBe(-3);
  });

  it("mengembalikan 0 untuk hari ini", () => {
    expect(daysUntil(new Date())).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("memformat IDR tanpa desimal jika bilangan bulat", () => {
    const result = formatCurrency(1500000, "IDR");
    expect(result).toContain("Rp");
    expect(result).toContain("1.500.000");
    expect(result).not.toContain(",00");
  });

  it("memformat IDR dengan desimal jika ada pecahan", () => {
    const result = formatCurrency(1500000.5, "IDR");
    expect(result).toContain("1.500.000");
  });
});
