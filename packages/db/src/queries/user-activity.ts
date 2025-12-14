import { db } from "../index";
import { eq, and, gte, lte } from "drizzle-orm";
import { userActivityHistory } from "../schema";

export async function logUserActivity(data: {
  userId: string;
  taskId: number;
  actualStartTime: Date;
  actualEndTime: Date;
  durationDeviation: number;
  wasCompleted: boolean;
}) {
  const [activity] = await db.insert(userActivityHistory)
    .values(data)
    .returning();
  return activity;
}

export async function getUserActivitiesByTimeRange(
  userId: string,
  startDate: Date,
  endDate?: Date
) {
  const conditions = [
    eq(userActivityHistory.userId, userId),
    gte(userActivityHistory.loggedAt, startDate)
  ];

  if (endDate) {
    conditions.push(lte(userActivityHistory.loggedAt, endDate));
  }

  return await db
    .select()
    .from(userActivityHistory)
    .where(and(...conditions))
    .orderBy(userActivityHistory.loggedAt);
}

export async function getRecentUserActivities(userId: string, limit = 100) {
  return await db
    .select()
    .from(userActivityHistory)
    .where(eq(userActivityHistory.userId, userId))
    .orderBy(userActivityHistory.loggedAt)
    .limit(limit);
}

export async function getUserActivitiesForAnalysis(userId: string, monthsAgo = 3) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsAgo);

  return await db
    .select()
    .from(userActivityHistory)
    .where(
      and(
        eq(userActivityHistory.userId, userId),
        gte(userActivityHistory.loggedAt, startDate)
      )
    )
    .orderBy(userActivityHistory.loggedAt);
}