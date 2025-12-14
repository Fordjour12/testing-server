import { db } from "../index";
import { eq, and } from "drizzle-orm";
import { userProductivityInsights } from "../schema";

export async function getUserProductivityInsights(userId: string) {
  const insights = await db
    .select()
    .from(userProductivityInsights)
    .where(eq(userProductivityInsights.userId, userId));

  return insights;
}

export async function getUserProductivityInsightByType(
  userId: string,
  insightType: 'PeakEnergy' | 'CompletionRate' | 'SessionDuration' | 'Challenges'
) {
  const [insight] = await db
    .select()
    .from(userProductivityInsights)
    .where(
      and(
        eq(userProductivityInsights.userId, userId),
        eq(userProductivityInsights.insightType, insightType)
      )
    )
    .limit(1);

  return insight;
}

export async function upsertProductivityInsight(
  userId: string,
  insightType: 'PeakEnergy' | 'CompletionRate' | 'SessionDuration' | 'Challenges',
  insightValueJson: any
) {
  const [updatedInsight] = await db
    .insert(userProductivityInsights)
    .values({
      userId,
      insightType,
      insightValueJson
    })
    .onConflictDoUpdate({
      target: [userProductivityInsights.userId, userProductivityInsights.insightType],
      set: {
        insightValueJson,
        lastUpdated: new Date()
      }
    })
    .returning();

  return updatedInsight;
}

export async function createProductivityInsight(
  userId: string,
  insightType: 'PeakEnergy' | 'CompletionRate' | 'SessionDuration' | 'Challenges',
  insightValueJson: any
) {
  const [newInsight] = await db.insert(userProductivityInsights)
    .values({
      userId,
      insightType,
      insightValueJson
    })
    .returning();

  return newInsight;
}