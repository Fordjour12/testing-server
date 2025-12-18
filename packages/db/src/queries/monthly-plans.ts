import { db } from "../index";
import { eq, and } from "drizzle-orm";
import { monthlyPlans, planTasks } from "../schema";

export async function createMonthlyPlan(data: {
  userId: string;
  preferenceId: number;
  monthYear: string;
  aiPrompt: string;
  aiResponseRaw: any;
  monthlySummary: string;
  rawAiResponse?: string;
  extractionConfidence?: number;
  extractionNotes?: string;
}) {
  const [newPlan] = await db.insert(monthlyPlans)
    .values(data)
    .returning();
  return newPlan;
}

export async function getCurrentMonthlyPlan(userId: string, monthYear: string) {
  const [currentPlan] = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        eq(monthlyPlans.monthYear, monthYear)
      )
    )
    .limit(1);
  return currentPlan;
}

export async function getMonthlyPlanById(planId: number) {
  const [plan] = await db
    .select()
    .from(monthlyPlans)
    .where(eq(monthlyPlans.id, planId))
    .limit(1);
  return plan;
}

export async function getCurrentMonthlyPlanWithTasks(userId: string, monthYear: string) {
  // 1. Query for current month's plan
  const [currentPlan] = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        eq(monthlyPlans.monthYear, monthYear)
      )
    )
    .limit(1);

  if (!currentPlan) {
    return null;
  }

  // 2. Query associated tasks
  const tasks = await db
    .select()
    .from(planTasks)
    .where(eq(planTasks.planId, currentPlan.id))
    .orderBy(planTasks.startTime);

  // 3. Combine tasks into weekly/daily structure
  return {
    ...currentPlan,
    tasks
  };
}