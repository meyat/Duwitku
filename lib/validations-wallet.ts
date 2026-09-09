import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(1, "Nama wallet wajib diisi").max(100),
  type: z.enum(["BANK", "CASH", "E_WALLET", "CREDIT_CARD", "OTHER"]),
  bankName: z.string().max(50).optional().nullable(),
  initialBalance: z.number().default(0),
  color: z.string().default("#25d366"),
});

export const BANK_PRESETS = [
  "BCA",
  "BRI",
  "Mandiri",
  "BNI",
  "CIMB Niaga",
  "Danamon",
  "Permata",
  "BTN",
  "BSI",
  "Lainnya",
];
