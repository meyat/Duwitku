import { describe, it, expect } from "vitest";
import { calculateNextRunDate } from "../lib/recurring-utils";

describe("calculateNextRunDate", () => {
  it("menambah 1 hari untuk frekuensi DAILY", () => {
    const current = new Date(2026, 0, 1);
    const next = calculateNextRunDate(current, "DAILY");
    expect(next.getDate()).toBe(2);
  });

  it("menambah 7 hari untuk frekuensi WEEKLY", () => {
    const current = new Date(2026, 0, 1);
    const next = calculateNextRunDate(current, "WEEKLY");
    expect(next.getDate()).toBe(8);
  });

  it("menambah 1 bulan untuk frekuensi MONTHLY", () => {
    const current = new Date(2026, 0, 15);
    const next = calculateNextRunDate(current, "MONTHLY");
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(15);
  });

  it("menambah 1 tahun untuk frekuensi YEARLY", () => {
    const current = new Date(2026, 0, 1);
    const next = calculateNextRunDate(current, "YEARLY");
    expect(next.getFullYear()).toBe(2027);
  });

  it("menambah interval khusus untuk frekuensi CUSTOM", () => {
    const current = new Date(2026, 0, 1);
    const next = calculateNextRunDate(current, "CUSTOM", 10);
    expect(next.getDate()).toBe(11);
  });

  it("default 30 hari untuk CUSTOM tanpa interval eksplisit", () => {
    const current = new Date(2026, 0, 1);
    const next = calculateNextRunDate(current, "CUSTOM", null);
    expect(next.getMonth()).toBe(0); // 1 Jan + 30 hari = 31 Jan, masih di bulan Januari
    expect(next.getDate()).toBe(31);
  });
});
