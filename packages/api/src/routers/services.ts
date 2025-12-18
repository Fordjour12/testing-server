import { Hono } from 'hono';
import {
   preparePlanGeneration,
   createStagingPlan,
   generateStagingKey,
   logActivityWithDetails,
   recalculateInsights as recalculateInsightsQuery
} from '@testing-server/db';
import { getOpenRouterService } from '../lib/openrouter';
import { handleAIServiceFailure } from '../services/plan-generation';
import { responseExtractor } from '@testing-server/response-parser';

export const servicesRouter = new Hono();

// POST /service/generate - Internal AI plan generation service (Approach 2: Staging Table)
servicesRouter.post('/generate', async (c) => {
   try {
      const { preferenceId, userId } = await c.req.json();

      if (!preferenceId || !userId) {
         return c.json({ error: 'preferenceId and userId are required' }, 400);
      }

      // Prepare plan generation (checks quota, fetches user data)
      const planData = await preparePlanGeneration(preferenceId, userId);

      // Call OpenRouter API
      const openRouterService = getOpenRouterService();
      const aiResponse = await openRouterService.generatePlan(planData.prompt);
      console.log(`OpenRouter response received, format: ${aiResponse.metadata.format}`);

      // Parse the AI response using the shared parser
      const parsedResponse = responseExtractor.extractAllStructuredData(aiResponse.rawContent);
      const monthlyPlan = responseExtractor.convertToMonthlyPlan(parsedResponse, planData.monthYear);

      // Generate unique staging key
      const stagingKey = generateStagingKey(userId);

      // Save to staging table
      const stagingPlan = await createStagingPlan({
         userId,
         stagingKey,
         planData: monthlyPlan,
         extractionConfidence: parsedResponse.metadata.confidence,
         extractionNotes: parsedResponse.metadata.extractionNotes,
         aiResponseRaw: parsedResponse,
         monthYear: planData.monthYear,
         preferencesId: planData.preferenceId
      });

      return c.json({
         success: true,
         data: {
            stagingKey,
            stagingPlan,
            expiresAt: stagingPlan.expiresAt
         },
         message: 'Plan generated and staged for preview'
      });

   } catch (error) {
      console.error('Error generating plan:', error);
      try {
         handleAIServiceFailure(error);
      } catch (serviceError) {
         return c.json({
            success: false,
            error: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
         }, 500);
      }
   }
});

// POST /service/log-activity - Internal activity logging service
servicesRouter.post('/log-activity', async (c) => {
   try {
      const { task, completionDetails } = await c.req.json();

      if (!task || !completionDetails) {
         return c.json({ error: 'task and completionDetails are required' }, 400);
      }

      await logActivityWithDetails(task.id, completionDetails);

      return c.json({
         success: true,
         message: 'Activity logged successfully'
      });

   } catch (error) {
      console.error('Error logging activity:', error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : 'Failed to log activity'
      }, 500);
   }
});

// POST /service/recalculate-insights - Internal insights recalculation service
servicesRouter.post('/recalculate-insights', async (c) => {
   try {
      const { userId } = await c.req.json();

      if (!userId) {
         return c.json({ error: 'userId is required' }, 400);
      }

      const updatedInsights = await recalculateInsightsQuery(userId);

      return c.json({
         success: true,
         data: updatedInsights,
         message: 'Insights recalculated successfully'
      });

   } catch (error) {
      console.error('Error recalculating insights:', error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : 'Failed to recalculate insights'
      }, 500);
   }
});