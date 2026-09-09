import { prisma } from "@/lib/prisma";

export const MAX_GROUP_MEMBERS = 5;

export async function getAcceptedGroupOrError(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });

  if (!group) return { group: null, membership: null };

  const membership = group.members.find((m) => m.userId === userId && m.status === "ACCEPTED");

  return { group, membership: membership ?? null };
}

export function getAcceptedMemberIds(group: { members: { userId: string; status: string }[] }) {
  return group.members.filter((m) => m.status === "ACCEPTED").map((m) => m.userId);
}
