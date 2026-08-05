import { z } from "zod";

export const investmentSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi").max(150),
  symbol: z.string().max(20).optional().nullable(),
  type: z.enum(["STOCK", "CRYPTO", "BOND", "MUTUAL_FUND", "GOLD"]),
  units: z.number().positive("Jumlah unit harus lebih besar dari nol"),
  avgBuyPrice: z.number().min(0, "Harga beli tidak boleh negatif"),
  currentPrice: z.number().min(0, "Harga saat ini tidak boleh negatif"),
  purchaseDate: z.coerce.date(),
  note: z.string().max(500).optional().nullable(),
});
