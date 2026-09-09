import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { buildFullBackup } from "@/lib/backup";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const backup = await buildFullBackup(user!.id);
  const filename = `backup-duwitku-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
