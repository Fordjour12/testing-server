/**
 * Simplified Plan Generation Service
 * 
 * This is the "Re-Cracked Hybrid" approach - a simplified version that:
 * 1. Always generates a plan
 * 2. Always auto-stages it (saves as draft)
 * 3. Returns the plan data + draft key
 * 4. User can then save or discard
 * 
 * No complex decision logic, no multiple modes, just one simple flow.
 */

import {
	createGoalPreference,
	createDraft,
	getDraft,
	deleteDraft,
	saveGeneratedPlan
} from "@testing-server/db";
import { getOpenRouterService } from "../lib/openrouter";
import { responseExtractor } from "../lib/response-extractor";

export interface GeneratePlanInput {
	userId: string;
	goalsText: string;
	taskComplexity: "Simple" | "Balanced" | "Ambitious";
	focusAreas: string;
	weekendPreference: "Work" | "Rest" | "Mixed";
	fixedCommitmentsJson: {
		commitments: Array<{
			dayOfWeek: string;
			startTime: string;
			endTime: string;
			description: string;
		}>;
	};
}

export interface GeneratePlanResult {
	success: true;
	draftKey: string;
	planData: any;
	preferenceId: number;
	generatedAt: string;
}

export interface GeneratePlanError {
	success: false;
	error: string;
}

/**
 * Generate a plan and auto-stage it
 * 
 * This is the main entry point for plan generation.
 * It always follows the same flow:
 * 1. Save user preferences
 * 2. Call AI
 * 3. Parse response
 * 4. Auto-stage as draft
 * 5. Return plan data + draft key
 */
export async function generatePlan(
	input: GeneratePlanInput
): Promise<GeneratePlanResult | GeneratePlanError> {
	try {
		console.log(`[Plan Generation] Starting for user: ${input.userId}`);

		// 1. Save user preferences/goals
		const preference = await createGoalPreference({
			userId: input.userId,
			goalsText: input.goalsText,
			taskComplexity: input.taskComplexity,
			focusAreas: input.focusAreas,
			weekendPreference: input.weekendPreference,
			fixedCommitmentsJson: input.fixedCommitmentsJson,
		});

		if (!preference) {
			return { success: false, error: "Failed to save planning inputs" };
		}

		console.log(`[Plan Generation] Preferences saved with ID: ${preference.id}`);

		// 2. Build prompt and call AI
		const prompt = buildPrompt(input);
		const openRouter = getOpenRouterService();

		console.log(`[Plan Generation] Calling AI service...`);
		const aiResponse = await openRouter.generatePlan(prompt);
		console.log(`[Plan Generation] AI response received, length: ${aiResponse.rawContent.length}`);

		// 3. Parse AI response
		const parsedResponse = responseExtractor.extractAllStructuredData(
			aiResponse.rawContent
		);

		const monthYear = new Date().toISOString().slice(0, 7) + "-01";

		// The parsed response already contains the structured plan data
		const planData = parsedResponse.structuredData;

		console.log(`[Plan Generation] Plan data extracted, confidence: ${parsedResponse.metadata.confidence}%`);

		// 4. Auto-stage the draft (so it survives refresh)
		const { draftKey } = await createDraft(
			input.userId,
			planData,
			preference.id,
			monthYear
		);

		console.log(`[Plan Generation] Draft created with key: ${draftKey}`);

		// 5. Return the plan + draft key
		return {
			success: true,
			draftKey,
			planData,
			preferenceId: preference.id,
			generatedAt: new Date().toISOString(),
		};
	} catch (error) {
		console.error("[Plan Generation] Failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Generation failed",
		};
	}
}

/**
 * Confirm and save a draft plan
 * 
 * This moves the draft from plan_drafts to monthly_plans
 * and then deletes the draft.
 */
export async function confirmPlan(
	userId: string,
	draftKey: string
): Promise<{ success: true; planId: number } | { success: false; error: string }> {
	try {
		console.log(`[Plan Confirm] Starting for user: ${userId}, draft: ${draftKey}`);

		// 1. Get the draft
		const draft = await getDraft(userId, draftKey);
		if (!draft) {
			return { success: false, error: "Draft not found or expired" };
		}

		console.log(`[Plan Confirm] Draft found, saving to monthly_plans...`);

		// 2. Save to permanent storage
		const planId = await saveGeneratedPlan(
			userId,
			draft.goalPreferenceId,
			draft.monthYear,
			"", // prompt - we don't need to store this
			{
				rawContent: JSON.stringify(draft.planData),
				metadata: {
					contentLength: JSON.stringify(draft.planData).length,
					format: "json" as const
				},
			}
		);

		console.log(`[Plan Confirm] Plan saved with ID: ${planId}`);

		// 3. Delete the draft
		await deleteDraft(userId, draftKey);
		console.log(`[Plan Confirm] Draft deleted`);

		return { success: true, planId };
	} catch (error) {
		console.error("[Plan Confirm] Failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Save failed",
		};
	}
}

/**
 * Build the AI prompt from user input
 * 
 * This is simplified - just the essential information needed
 * for the AI to generate a good plan.
 */
function buildPrompt(input: GeneratePlanInput): string {
	const currentDate = new Date();
	const monthYear = currentDate.toISOString().slice(0, 7) + "-01";

	return `Generate a monthly productivity plan with the following requirements:

**User Goals:**
${input.goalsText}

**Preferences:**
- Task Complexity: ${input.taskComplexity}
- Focus Areas: ${input.focusAreas}
- Weekend Preference: ${input.weekendPreference}
- Fixed Commitments: ${JSON.stringify(input.fixedCommitmentsJson, null, 2)}

**Context:**
- Month: ${monthYear}
- Current Date: ${currentDate.toISOString()}

**Output Format (Strict JSON):**
{
  "monthly_summary": "A clear overview of the plan and key objectives",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Main theme for this week",
      "goals": ["Weekly goal 1", "Weekly goal 2"],
      "daily_tasks": {
        "Monday": [
          {
            "task_description": "Specific, actionable task",
            "focus_area": "Category from user's focus areas",
            "start_time": "ISO 8601 combined date and time (e.g., 2025-01-01T09:00:00Z)",
            "end_time": "ISO 8601 combined date and time",
            "difficulty_level": "simple|moderate|advanced",
            "scheduling_reason": "Why this task is scheduled at this time"
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
  ]
}

**Requirements:**
- Create realistic, achievable tasks
- Respect the user's weekend preference
- Avoid scheduling during fixed commitments
- Match task complexity to user's preference
- Focus on the specified focus areas
- Provide clear, actionable task descriptions

Please generate a complete monthly plan following this structure.`;
}
