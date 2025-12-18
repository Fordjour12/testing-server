import { Hono } from 'hono';
import {
   preparePlanGeneration,
   saveGeneratedPlan,
   logActivityWithDetails,
   recalculateInsights as recalculateInsightsQuery
} from '@testing-server/db';
import { getOpenRouterService } from '../lib/openrouter';
import { type Variables } from "../index"


export const servicesRouter = new Hono<{ Variables: Variables }>();

// POST /service/generate - Internal AI plan generation service
servicesRouter.post('/generate', async (c) => {
   try {
      const { preferenceId, userId } = await c.req.json();

      if (!preferenceId || !userId) {
         return c.json({ error: 'preferenceId and userId are required' }, 400);
      }

      // Prepare plan generation (checks quota, fetches user data)
      const planData = await preparePlanGeneration(preferenceId, userId);

      let aiResponse;

      // Call OpenRouter API with fallback to mock data
      if (!process.env.OPENROUTER_API_KEY) {
         console.log('OpenRouter API key not configured, using mock data');
         throw new Error('OpenRouter API key not configured');
      }

      const openRouterService = getOpenRouterService();
      aiResponse = await openRouterService.generatePlan(planData.prompt);


      // Save the generated plan to the database
      const planId = await saveGeneratedPlan(
         userId,
         planData.preferenceId,
         planData.monthYear,
         planData.prompt,
         aiResponse
      );

      return c.json({
         success: true,
         planId,
         message: 'Plan generated successfully'
      });

   } catch (error) {
      console.error('Error generating plan:', error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : 'Failed to generate plan'
      }, 500);
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
