import { db } from "../index";
import { eq } from "drizzle-orm";
import { userProductivityInsights } from "../schema";
import {
   getCurrentQuota,
   decrementGenerationQuota,
   getGoalPreferenceById,
   createMonthlyPlan,
   createPlanTasks
} from "./index";

import { processAIResponse, createDefaultTasks } from "../services/ai-response-processing";
import { responseExtractor } from "../lib/response-extractor";

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
      const aiPrompt = constructAIPrompt(preferences, insights, currentDate, currentMonth);

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
   aiResponse: { rawContent: string; metadata: { contentLength: number; format: 'json' | 'text' | 'mixed' } }
) {
   try {
      console.log(`Saving generated plan for user ${userId}, response format: ${aiResponse.metadata.format}`);

      // Use response extractor to safely extract structured data
      const extractedData = processAIResponse(aiResponse);

      // Get monthly summary (fallback to extracted summary or generate one)
      const monthlySummary = extractedData.structuredData.monthly_summary ||
         responseExtractor.extractMonthlySummary(aiResponse.rawContent);

      // Insert full response into monthlyPlans with extraction metadata
      const newPlan = await createMonthlyPlan({
         userId,
         preferenceId,
         monthYear,
         aiPrompt,
         aiResponseRaw: extractedData.structuredData, // Store extracted structured data
         monthlySummary,
         rawAiResponse: aiResponse.rawContent, // Store raw response
         extractionConfidence: extractedData.metadata.confidence,
         extractionNotes: extractedData.metadata.extractionNotes
      });

      // Extract tasks and bulk insert into planTasks
      let tasks: Array<{
         planId: number;
         taskDescription: string;
         focusArea: string;
         startTime: Date;
         endTime: Date;
         difficultyLevel: 'simple' | 'moderate' | 'advanced';
         schedulingReason: string;
         isCompleted: boolean;
      }> = [];

      if (extractedData.structuredData.weekly_breakdown) {
         const taskData = responseExtractor.extractTasksFromBreakdown(extractedData.structuredData.weekly_breakdown);

         tasks = taskData.map((task: any) => ({
            planId: newPlan?.id || 0,
            taskDescription: task.title,
            focusArea: task.category,
            startTime: new Date(task.dueDate + 'T09:00:00Z'), // Use 9 AM as default start time
            endTime: new Date(task.dueDate + `T${9 + (task.estimatedHours || 2)}:00:00Z`), // Add estimated hours
            difficultyLevel: task.priority === 'High' ? 'advanced' :
               task.priority === 'Medium' ? 'moderate' : 'simple',
            schedulingReason: task.description || `Scheduled task for ${task.dayOfWeek || 'unknown day'}`,
            isCompleted: false
         }));
      }

      // If no tasks were extracted, create default tasks based on summary
      if (tasks.length === 0) {
         console.warn('No tasks extracted from AI response, creating default tasks');
         tasks = createDefaultTasks(newPlan?.id || 0);
      }

      if (tasks.length > 0) {
         await createPlanTasks(tasks);
         console.log(`Created ${tasks.length} tasks for plan ${newPlan?.id}`);
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

function constructAIPrompt(preferences: any, insights: any[], currentDate: Date, currentMonth: string): string {
   const insightsText = insights && insights.length > 0
      ? JSON.stringify(insights)
      : 'No historical productivity data available. This appears to be a first-time user.';

   const preferencesText = `
Goals: ${preferences.goalsText}
Task Complexity: ${preferences.taskComplexity}
Focus Areas: ${preferences.focusAreas}
Weekend Preference: ${preferences.weekendPreference}
Fixed Commitments: ${JSON.stringify(preferences.fixedCommitmentsJson)}
`;

   return `
<system_prompt>
You are an expert personalized planning assistant with deep expertise in creating monthly plans that adapt to individual user patterns, energy levels, and proven capabilities. Create highly personalized plans that leverage the user's documented strengths while addressing their specific challenges. Focus on realistic, achievable planning that builds on their historical success patterns.
</system_prompt>

You are an intelligent monthly planning assistant specializing in personalized, actionable plans. Your task is to transform user goals into a structured monthly plan tailored to their unique patterns, preferences, and history.

**User Input (Preferences & Goals):**
${preferencesText}

**Enhanced User Context (Productivity Insights):**
${insightsText}

**Context:**
- Current month: ${currentMonth}
- Current date: ${currentDate.toISOString()}

**Your Enhanced Responsibilities:**
1. Parse and deeply understand the user's goals
2. Break down large goals into weekly milestones considering user's proven capabilities
3. Create daily tasks that match the user's documented productivity patterns and time availability
4. Align tasks with user's peak energy periods and preferred work styles
5. Consider user's historical completion rates and adjust difficulty accordingly
6. Identify potential conflicts considering user's current commitments and energy patterns
7. Suggest optimal timing based on user's documented patterns and preferences

**Personalized Planning Requirements:**
- Match task difficulty to user's completion rate history (adjust if <70% or >90%)
- Schedule high-focus tasks during user's peak energy periods
- Respect user's preferred session duration and avoid overloading
- Consider seasonal/monthly patterns in user's productivity
- Align with user's defined success metrics and values
- Account for user's time zone and typical work hours

**Output Format (Strict JSON):**
{
"monthly_summary": "Personalized overview acknowledging user's patterns and goals",
"weekly_breakdown": [
 {
   "week": 1,
   "focus": "Theme aligned with user's current priorities and energy patterns",
   "goals": ["Weekly goal tailored to user's capabilities and preferences"],
   "daily_tasks": {
     "Monday": [
       {
         "task_description": "Specific, actionable task matched to user's patterns",
         "focus_area": "Category from user's focus areas",
         "start_time": "ISO 8601 combined date and time (e.g., 2025-01-01T09:00:00Z)",
         "end_time": "ISO 8601 combined date and time",
         "difficulty_level": "simple|moderate|advanced",
         "scheduling_reason": "Specific reason (e.g., 'Matches peak energy window')"
       }
     ],
     "Tuesday": [],
     "Wednesday": [],
     "Thursday": [],
     "Friday": [],
     "Saturday": [],
     "Sunday": []
   }
 }
],
"personalization_notes": ["How the plan was adapted to user's specific patterns"],
"productivity_insights": ["Key observations about user's productivity patterns used in planning"],
"potential_conflicts": ["Conflicts identified based on user's current commitments"],
"success_metrics": ["Metrics aligned with user's documented preferences"],
"energy_management": ["Suggestions for maintaining energy based on user's patterns"]
}

**Enhanced Constraints:**
- Daily task load matches user's historical completion patterns
- Task complexity adjusted based on user's proven capabilities
- Timing considers user's peak energy periods and documented preferences
- Includes personalized strategies for overcoming user's common challenges
- Respects user's work-life balance preferences and time constraints
- Provides flexibility options that match user's adaptive planning style
`;
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
