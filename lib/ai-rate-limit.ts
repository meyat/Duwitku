import { prisma } from "@/lib/prisma";

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "20", 10);

export async function getAiUsageToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.aiChatMessage.count({
    where: { userId, role: "user", createdAt: { gte: startOfDay } },
  });

  return { used: count, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - count) };
}

export async function checkAiRateLimit(userId: string) {
  const usage = await getAiUsageToday(userId);
  return usage.remaining > 0;
}

export { DAILY_LIMIT as AI_DAILY_LIMIT };
