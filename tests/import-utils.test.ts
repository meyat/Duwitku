import { describe, it, expect } from "vitest";
import { validateImportRow } from "../lib/import-utils";

describe("validateImportRow", () => {
  it("menandai baris valid ketika semua field wajib benar", () => {
    const row = validateImportRow(
      {
        title: "Makan Siang",
        amount: "50000",
        type: "Pengeluaran",
        category: "Makanan dan Minuman",
        date: "01/08/2026",
        paymentMethod: "Tunai",
        tags: "Kebutuhan;Bulanan",
        note: "",
      },
      0,
      "DD/MM/YYYY"
    );

    expect(row.isValid).toBe(true);
    expect(row.amount).toBe(50000);
    expect(row.type).toBe("EXPENSE");
    expect(row.tags).toEqual(["Kebutuhan", "Bulanan"]);
  });

  it("menandai baris tidak valid ketika judul kosong", () => {
    const row = validateImportRow(
      { title: "", amount: "1000", type: "Pemasukan", date: "01/08/2026" },
      0,
      "DD/MM/YYYY"
    );
    expect(row.isValid).toBe(false);
    expect(row.errors).toContain("Judul wajib diisi");
  });

  it("menandai baris tidak valid ketika nominal bukan angka positif", () => {
    const row = validateImportRow(
      { title: "Test", amount: "-500", type: "Pengeluaran", date: "01/08/2026" },
      0,
      "DD/MM/YYYY"
    );
    expect(row.isValid).toBe(false);
  });

  it("menandai baris tidak valid ketika jenis transaksi tidak dikenali", () => {
    const row = validateImportRow(
      { title: "Test", amount: "1000", type: "Tidak Diketahui", date: "01/08/2026" },
      0,
      "DD/MM/YYYY"
    );
    expect(row.isValid).toBe(false);
    expect(row.type).toBeNull();
  });

  it("mem-parsing tanggal sesuai format DD/MM/YYYY", () => {
    const row = validateImportRow(
      { title: "Test", amount: "1000", type: "Pemasukan", date: "25/12/2026" },
      0,
      "DD/MM/YYYY"
    );
    expect(row.date?.getDate()).toBe(25);
    expect(row.date?.getMonth()).toBe(11);
  });

  it("mem-parsing tanggal sesuai format YYYY-MM-DD", () => {
    const row = validateImportRow(
      { title: "Test", amount: "1000", type: "Pemasukan", date: "2026-12-25" },
      0,
      "YYYY-MM-DD"
    );
    expect(row.date?.getDate()).toBe(25);
    expect(row.date?.getMonth()).toBe(11);
  });

  it("menghasilkan rowHash yang konsisten untuk deteksi duplikasi", () => {
    const row1 = validateImportRow(
      { title: "Test", amount: "1000", type: "Pemasukan", date: "01/08/2026" },
      0,
      "DD/MM/YYYY"
    );
    const row2 = validateImportRow(
      { title: "Test", amount: "1000", type: "Pemasukan", date: "01/08/2026" },
      1,
      "DD/MM/YYYY"
    );
    expect(row1.rowHash).toBe(row2.rowHash);
  });
});
