import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

const notifPrefsSchema = z.object({
  browserNotification: z.boolean().optional(),
  billReminder: z.boolean().optional(),
  debtReminder: z.boolean().optional(),
  savingGoalReminder: z.boolean().optional(),
  recurringNotification: z.boolean().optional(),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user!.id },
    update: {},
    create: { userId: user!.id },
  });

  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = notifPrefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: user!.id },
      update: parsed.data,
      create: { userId: user!.id, ...parsed.data },
    });

    return NextResponse.json(prefs);
  } catch (err) {
    console.error("Update notification prefs error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
