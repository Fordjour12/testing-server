import { 
   createGoalPreference,
   saveGeneratedPlan 
} from '@testing-server/db';

// Internal service function that can be called directly without HTTP
export async function generatePlanInternalService(data: {
   userId: string;
   goalsText: string;
   taskComplexity: 'Simple' | 'Balanced' | 'Ambitious';
   focusAreas: string;
   weekendPreference: 'Work' | 'Rest' | 'Mixed';
   fixedCommitmentsJson: {
      commitments: Array<{
         dayOfWeek: string;
         startTime: string;
         endTime: string;
         description: string;
      }>
   };
}) {
   try {
      console.log("Internal service called with data:", { ...data, userId: data.userId });

      // 1. Insert into userGoalsAndPreferences table
      const newPreference = await createGoalPreference({
         userId: data.userId,
         goalsText: data.goalsText,
         taskComplexity: data.taskComplexity,
         focusAreas: data.focusAreas,
         weekendPreference: data.weekendPreference,
         fixedCommitmentsJson: data.fixedCommitmentsJson
      });

      if (!newPreference) {
         return {
            success: false,
            error: 'Failed to save planning inputs'
         };
      }

      // 2. For now, return a simple response without AI generation
      // In a real implementation, you would call the AI service directly here
      return {
         success: true,
         data: {
            preferenceId: newPreference.id,
            // Mock data for now - replace with actual AI service call
            aiResponse: {
               rawContent: "Mock AI response",
               metadata: {}
            },
            monthlyPlan: {
               id: `plan-${newPreference.id}`,
               title: `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Plan`,
               month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
               goals: data.goalsText.split('\n').filter(goal => goal.trim().length > 0),
               tasks: [],
               totalTasks: 0,
               estimatedHours: 0
            },
            monthYear: new Date().toISOString().slice(0, 7)
         }
      };
   } catch (error) {
      console.error('Error in internal service:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : 'Unknown error'
      };
   }
}