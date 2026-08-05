import { z } from "zod";

export const savingGoalSchema = z.object({
  name: z.string().min(1, "Nama target wajib diisi").max(100),
  targetAmount: z.number().positive("Nominal target harus lebih besar dari nol"),
  deadline: z.coerce.date().nullable().optional(),
  icon: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const contributionSchema = z.object({
  amount: z.number().refine((v) => v !== 0, "Nominal tidak boleh nol"),
  note: z.string().max(300).optional().nullable(),
});

export const billSchema = z.object({
  name: z.string().min(1, "Nama tagihan wajib diisi").max(150),
  amount: z.number().positive("Nominal harus lebih besar dari nol"),
  categoryId: z.string().nullable().optional(),
  dueDate: z.coerce.date(),
  reminderOffset: z
    .enum(["ON_DUE_DATE", "ONE_DAY_BEFORE", "THREE_DAYS_BEFORE", "SEVEN_DAYS_BEFORE", "CUSTOM"])
    .default("THREE_DAYS_BEFORE"),
  customReminderAt: z.coerce.date().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const recurringSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(150),
  amount: z.number().positive("Nominal harus lebih besar dari nol"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().nullable().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
  customIntervalDays: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  requireConfirmation: z.boolean().default(false),
  reminderOffset: z
    .enum(["ON_DUE_DATE", "ONE_DAY_BEFORE", "THREE_DAYS_BEFORE", "SEVEN_DAYS_BEFORE", "CUSTOM"])
    .default("ON_DUE_DATE"),
});

export const debtSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(150),
  counterpartyName: z.string().min(1, "Nama pihak terkait wajib diisi").max(150),
  type: z.enum(["DEBT", "RECEIVABLE"]),
  totalAmount: z.number().positive("Total nominal harus lebih besar dari nol"),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  contactNumber: z.string().max(30).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "E_WALLET",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "OTHER",
  ]),
  installmentSystem: z.enum(["AUTOMATIC", "MANUAL"]),
  downPayment: z.number().min(0).default(0),

  // Automatic mode fields
  months: z.number().int().positive().optional(),
  firstPaymentDate: z.coerce.date().optional(),

  // Manual mode fields
  manualInstallments: z
    .array(
      z.object({
        dueDate: z.coerce.date(),
        billedAmount: z.number().positive(),
      })
    )
    .optional(),
});

export const installmentPaymentSchema = z.object({
  paidAmount: z.number().positive("Nominal pembayaran harus lebih besar dari nol"),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "E_WALLET",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "OTHER",
  ]),
  note: z.string().max(500).optional().nullable(),
  overpayStrategy: z.enum(["REDUCE_NEXT", "EXTRA", "AUTO_SETTLE_NEXT"]).optional(),
  createTransaction: z.boolean().default(true),
});
