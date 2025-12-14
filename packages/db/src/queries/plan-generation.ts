import { db } from "../index";
import { eq } from "drizzle-orm";
import { userProductivityInsights } from "../schema";
import {
  getCurrentQuota,
  decrementGenerationQuota,
  incrementGenerationQuota,
  getGoalPreferenceById,
  createMonthlyPlan,
  createPlanTasks
} from "./index";

export async function preparePlanGeneration(preferenceId: number, userId: string) {
  try {
    // 1. Check & decrement generation quota
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

    const quota = await getCurrentQuota(userId, currentMonth);

    if (!quota || quota.generationsUsed >= quota.totalAllowed) {
      throw new Error('Generation quota exceeded');
    }

    // Decrement quota
    await decrementGenerationQuota(quota.id);

    // 2. Fetch User Context
    const preferences = await getGoalPreferenceById(preferenceId);

    if (!preferences) {
      throw new Error('Preferences not found');
    }

    const insights = await getUserProductivityInsights(userId);

    // 3. Construct the full prompt string
    const aiPrompt = constructAIPrompt(preferences, insights);

    // 4. Return the data needed for AI generation
    return {
      prompt: aiPrompt,
      preferenceId,
      userId,
      monthYear: currentMonth
    };

  } catch (error) {
    console.error('Error preparing plan generation:', error);
    throw error;
  }
}

export async function saveGeneratedPlan(
  userId: string,
  preferenceId: number,
  monthYear: string,
  aiPrompt: string,
  aiResponse: any
) {
  try {
    // Parse JSON response & extract summary
    const monthlySummary = extractSummary(aiResponse);

    // Insert full response into monthlyPlans
    const newPlan = await createMonthlyPlan({
      userId,
      preferenceId,
      monthYear,
      aiPrompt,
      aiResponseRaw: aiResponse,
      monthlySummary
    });

    // Extract tasks and bulk insert into planTasks
    const tasks = extractTasksFromResponse(aiResponse, newPlan?.id || 0);
    if (tasks.length > 0) {
      await createPlanTasks(tasks);
    }

    return newPlan?.id || 0;
  } catch (error) {
    console.error('Error saving generated plan:', error);
    throw error;
  }
}

async function getUserProductivityInsights(userId: string) {
  const insights = await db
    .select()
    .from(userProductivityInsights)
    .where(eq(userProductivityInsights.userId, userId));

  // Handle case where insights might be missing (first-time user)
  if (!insights || insights.length === 0) {
    return [];
  }

  return insights;
}

function constructAIPrompt(preferences: any, insights: any[]): string {
  const insightsText = insights && insights.length > 0
    ? JSON.stringify(insights)
    : 'No historical productivity data available. This appears to be a first-time user.';

  return `
    Generate a monthly plan based on the following user preferences:

    Goals: ${preferences.goalsText}
    Task Complexity: ${preferences.taskComplexity}
    Focus Areas: ${preferences.focusAreas}
    Weekend Preference: ${preferences.weekendPreference}
    Fixed Commitments: ${JSON.stringify(preferences.fixedCommitmentsJson)}

    Productivity Insights: ${insightsText}

    Please provide a JSON response with the following structure:
    {
      "monthly_summary": "Brief overview of the month",
      "weekly_breakdown": [
        {
          "week": 1,
          "focus": "Weekly focus area",
          "tasks": [
            {
              "task_description": "Specific task",
              "focus_area": "Category",
              "start_time": "2025-01-01T09:00:00Z",
              "end_time": "2025-01-01T10:00:00Z",
              "difficulty_level": "simple|moderate|advanced",
              "scheduling_reason": "Why scheduled at this time"
            }
          ]
        }
      ]
    }
  `;
}


function extractSummary(aiResponse: any): string {
  return aiResponse.monthly_summary || '';
}

function extractTasksFromResponse(aiResponse: any, planId: number): Array<{
  planId: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: 'simple' | 'moderate' | 'advanced';
  schedulingReason: string;
  isCompleted: boolean;
}> {
  const tasks: Array<{
    planId: number;
    taskDescription: string;
    focusArea: string;
    startTime: Date;
    endTime: Date;
    difficultyLevel: 'simple' | 'moderate' | 'advanced';
    schedulingReason: string;
    isCompleted: boolean;
  }> = [];

  if (aiResponse.weekly_breakdown) {
    aiResponse.weekly_breakdown.forEach((week: any) => {
      if (week.tasks) {
        week.tasks.forEach((task: any) => {
          tasks.push({
            planId,
            taskDescription: task.task_description,
            focusArea: task.focus_area,
            startTime: new Date(task.start_time),
            endTime: new Date(task.end_time),
            difficultyLevel: task.difficulty_level,
            schedulingReason: task.scheduling_reason,
            isCompleted: false
          });
        });
      }
    });
  }

  return tasks;
}

export async function failPlanGeneration(planId: number, errorMessage: string) {
  try {
    // For now, we'll just log the error since there's no dedicated failed_plans table
    // In a more complete implementation, you might want to:
    // 1. Create a failed_plans table to track failures
    // 2. Store the error details and planId for debugging
    // 3. Set up monitoring/alerting for failed generations

    console.error(`Plan generation failed for planId ${planId}:`, errorMessage);

    // Note: planId from the streaming router is currently a timestamp (Date.now())
    // not a database ID, so we can't directly update database records
    // This would need to be implemented when proper streaming status tracking is added

    return { success: true, planId, error: errorMessage };
  } catch (error) {
    console.error('Error handling failed plan generation:', error);
    throw error;
  }
}