import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const invites = await prisma.groupMember.findMany({
    where: { userId: user!.id, status: "PENDING" },
    include: {
      group: {
        include: { owner: { select: { name: true, email: true } } },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(invites);
}
