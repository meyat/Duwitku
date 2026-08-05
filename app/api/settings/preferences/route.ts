import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const preferencesSchema = z.object({
  currency: z.enum(["IDR", "USD", "EUR", "SGD", "MYR"]).optional(),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  weekStartsOn: z.number().int().min(0).max(1).optional(),
});

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: parsed.data,
    });

    return NextResponse.json({
      currency: updated.currency,
      dateFormat: updated.dateFormat,
      timezone: updated.timezone,
      language: updated.language,
      theme: updated.theme,
      weekStartsOn: updated.weekStartsOn,
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
