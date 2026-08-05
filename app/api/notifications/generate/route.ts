import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { generateNotificationsForUser } from "@/lib/notification-utils";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const created = await generateNotificationsForUser(user!.id);

  return NextResponse.json({ createdCount: created?.length ?? 0 });
}
