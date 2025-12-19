import { db } from "../index";
import { eq, and, lt, desc } from "drizzle-orm";
import { planStaging } from "../schema";

export async function createStagingPlan(data: {
  userId: string;
  stagingKey: string;
  planData: any;
  extractionConfidence?: number;
  extractionNotes?: string;
  aiResponseRaw: any;
  monthYear: string;
  preferencesId?: number;
  expiresAt?: Date;
}) {
  const [stagingPlan] = await db.insert(planStaging)
    .values({
      ...data,
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
    })
    .returning();
  return stagingPlan;
}

export async function getStagingPlan(stagingKey: string) {
  const [plan] = await db
    .select()
    .from(planStaging)
    .where(
      and(
        eq(planStaging.stagingKey, stagingKey),
        eq(planStaging.isSaved, false)
      )
    );
  return plan;
}

export async function getStagingPlanByUser(userId: string, monthYear: string) {
  const [plan] = await db
    .select()
    .from(planStaging)
    .where(
      and(
        eq(planStaging.userId, userId),
        eq(planStaging.monthYear, monthYear),
        eq(planStaging.isSaved, false)
      )
    );
  return plan;
}

export async function markStagingPlanAsSaved(stagingKey: string) {
  const [updatedPlan] = await db
    .update(planStaging)
    .set({
      isSaved: true,
      savedAt: new Date(),
    })
    .where(eq(planStaging.stagingKey, stagingKey))
    .returning();
  return updatedPlan;
}

export async function deleteStagingPlan(stagingKey: string) {
  const [deletedPlan] = await db
    .delete(planStaging)
    .where(eq(planStaging.stagingKey, stagingKey))
    .returning();
  return deletedPlan;
}

export async function cleanupExpiredStagingPlans() {
  const deletedPlans = await db
    .delete(planStaging)
    .where(
      and(
        lt(planStaging.expiresAt, new Date()),
        eq(planStaging.isSaved, false)
      )
    )
    .returning();
  return deletedPlans;
}

export async function getUserStagingPlans(userId: string) {
  const plans = await db
    .select()
    .from(planStaging)
    .where(
      and(
        eq(planStaging.userId, userId),
        eq(planStaging.isSaved, false)
      )
    )
    .orderBy(desc(planStaging.timestamp));
  return plans;
}

// Generate a unique staging key
export function generateStagingKey(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}-${timestamp}-${random}`;
}