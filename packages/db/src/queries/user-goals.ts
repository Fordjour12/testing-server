import { db } from "../index";
import { eq, desc } from "drizzle-orm";
import { userGoalsAndPreferences } from "../schema";

export async function createGoalPreference(data: {
   userId: string;
   goalsText: string;
   taskComplexity: 'Simple' | 'Balanced' | 'Ambitious';
   focusAreas: string;
   weekendPreference: 'Work' | 'Rest' | 'Mixed';
   fixedCommitmentsJson: any;
}) {
   const [newPreference] = await db.insert(userGoalsAndPreferences)
      .values(data)
      .returning();
   return newPreference;
}

export async function getLatestGoalPreference(userId: string) {
   const [latestPreference] = await db
      .select()
      .from(userGoalsAndPreferences)
      .where(eq(userGoalsAndPreferences.userId, userId))
      .orderBy(desc(userGoalsAndPreferences.inputSavedAt))
      .limit(1);
   return latestPreference;
}

export async function getGoalPreferenceById(id: number) {
   const [preference] = await db
      .select()
      .from(userGoalsAndPreferences)
      .where(eq(userGoalsAndPreferences.id, id))
      .limit(1);
   return preference;
}
