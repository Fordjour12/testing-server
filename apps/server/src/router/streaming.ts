import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  preparePlanGeneration,
  saveGeneratedPlan,
  failPlanGeneration
} from '@testing-server/db';
import { getOpenRouterService } from '../lib/openrouter';

export const streamingRouter = new Hono();

// POST /api/streaming/generate-plan - Streaming AI plan generation endpoint
streamingRouter.post('/generate-plan', async (c) => {
  return streamSSE(c, async (stream) => {
    let planId: number | null = null;

    try {
      const { preferenceId, userId } = await c.req.json();

      if (!preferenceId || !userId) {
        await stream.writeSSE({
          data: JSON.stringify({ error: 'preferenceId and userId are required' }),
          event: 'error'
        });
        return;
      }

      // For now, we'll use a simple approach since the streaming infrastructure is not fully implemented
      planId = Date.now(); // Temporary ID for tracking purposes

      // Send initial acknowledgment with plan ID
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'initialized',
          planId,
          message: 'Plan generation started'
        }),
        event: 'progress',
        id: String(planId)
      });

      // Prepare plan generation (checks quota, fetches user data)
      const planData = await preparePlanGeneration(preferenceId, userId);

      let aiResponse: any;

      // Try OpenRouter API (simulated streaming via SSE)
      if (!process.env.OPENROUTER_API_KEY) {
        // Send error event via SSE
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.',
            planId
          }),
          event: 'error',
          id: String(planId)
        });

        // Mark plan as failed in database
        if (planId) {
          await failPlanGeneration(planId, 'OpenRouter API key not configured');
        }
        return;
      }

      try {
        const openRouterService = getOpenRouterService();

        // Send initial progress event
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'progress',
            content: 'Generating plan...',
            progress: {
              status: 'Calling OpenRouter API'
            }
          }),
          event: 'progress',
          id: String(planId)
        });

        // Generate plan using the existing non-streaming method
        aiResponse = await openRouterService.generatePlan(planData.prompt);

        // Send completion progress event
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'content',
            content: JSON.stringify(aiResponse),
            progress: {
              monthly_summary: aiResponse.monthly_summary,
              weekly_breakdown_complete: aiResponse.weekly_breakdown?.length || 0
            },
            isComplete: true
          }),
          event: 'progress',
          id: String(planId)
        });
      } catch (error) {
        const errorMessage = `Failed to generate plan with OpenRouter API: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('OpenRouter API error:', error);

        // Send error event via SSE
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: errorMessage,
            planId
          }),
          event: 'error',
          id: String(planId)
        });

        // Mark plan as failed in database
        if (planId) {
          await failPlanGeneration(planId, errorMessage);
        }
        return;
      }

      // Save the generated plan to database
      if (planId && aiResponse) {
        await saveGeneratedPlan(userId, preferenceId, planData.monthYear, planData.prompt, aiResponse);

        // Send completion event
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'complete',
            planId,
            message: 'Plan generation completed successfully'
          }),
          event: 'complete',
          id: String(planId)
        });
      }

    } catch (error) {
      console.error('Error during streaming plan generation:', error);

      // Handle failure in database
      if (planId) {
        await failPlanGeneration(planId, error instanceof Error ? error.message : 'Unknown error');
      }

      // Send error event
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown generation error',
          planId
        }),
        event: 'error',
        id: planId ? String(planId) : undefined
      });
    }
  });
});

// GET /api/streaming/status/:planId - Check generation status
streamingRouter.get('/status/:planId', async (c) => {
  try {
    const planId = parseInt(c.req.param('planId'));

    if (isNaN(planId)) {
      return c.json({ error: 'Invalid planId' }, 400);
    }

    // Query database for plan status
    // This would need to be implemented in the database layer
    // For now, return a placeholder response
    return c.json({
      success: true,
      planId,
      status: 'generating', // 'generating' | 'completed' | 'failed'
      progress: {
        percentage: 0,
        currentStep: 'Processing AI response'
      }
    });

  } catch (error) {
    console.error('Error checking plan status:', error);
    return c.json({
      success: false,
      error: 'Failed to check plan status'
    }, 500);
  }
});

// DELETE /api/streaming/cancel/:planId - Cancel ongoing generation
streamingRouter.delete('/cancel/:planId', async (c) => {
  try {
    const planId = parseInt(c.req.param('planId'));

    if (isNaN(planId)) {
      return c.json({ error: 'Invalid planId' }, 400);
    }

    // Mark plan as failed/cancelled in database
    await failPlanGeneration(planId, 'Generation cancelled by user');

    return c.json({
      success: true,
      planId,
      message: 'Plan generation cancelled'
    });

  } catch (error) {
    console.error('Error cancelling plan generation:', error);
    return c.json({
      success: false,
      error: 'Failed to cancel plan generation'
    }, 500);
  }
});

