import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const header = "Judul,Nominal,Jenis,Kategori,Tanggal,Metode Pembayaran,Tag,Catatan";
  const example1 = "Makan Siang,50000,Pengeluaran,Makanan dan Minuman,01/08/2026,Tunai,Kebutuhan,";
  const example2 = "Gaji Bulanan,8000000,Pemasukan,Gaji,01/08/2026,Transfer Bank,Bulanan,Gaji bulan Agustus";

  const csv = [header, example1, example2].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-import-transaksi.csv"',
    },
  });
}
