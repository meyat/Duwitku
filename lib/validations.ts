import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  inviteCode: z.string().min(1, "Kode undangan wajib diisi"),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const transactionSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  amount: z.number().positive("Nominal harus lebih besar dari nol"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().nullable().optional(),
  date: z.coerce.date(),
  paymentMethod: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "E_WALLET",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "OTHER",
  ]),
  note: z.string().max(1000).optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().default("Circle"),
  color: z.string().default("#25d366"),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Nama tag wajib diisi").max(30),
});
