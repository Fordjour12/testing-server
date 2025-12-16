import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getCurrentQuota, createGenerationQuota, updateGenerationQuota } from '@testing-server/db';
import type { Variables } from "../index"


export const quotaRouter = new Hono<{ Variables: Variables }>();

// GET /api/quota/current - Get current user's generation quota
quotaRouter.get('/current', async (c) => {
  try {
    // Get user ID from header or session following the same pattern as plan router
    const session = c.get('session');
    const user = session?.user;
    const userId = c.req.header('X-User-ID') || user?.id;

    if (!userId) {
      return c.json({
        success: false,
        error: 'User authentication required'
      }, 401);
    }

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Fetch current quota
    let quota = await getCurrentQuota(userId, currentMonth);

    // If no quota exists, create a default one
    if (!quota) {
      quota = await createGenerationQuota({
        userId: String(userId),
        monthYear: currentMonth,
        totalAllowed: 20, // Default monthly quota
        generationsUsed: 0,
        resetsOn: getNextMonth()
      });
    }

    return c.json({
      success: true,
      data: quota
    });

  } catch (error) {
    console.error('Error fetching current quota:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quota'
    }, 500);
  }
});

// POST /api/quota/request - Request additional tokens
quotaRouter.post('/request', zValidator('json', z.object({
  reason: z.string().min(10, 'Please provide a detailed reason for the request'),
  requestedAmount: z.number().min(1, 'Must request at least 1 token').max(100, 'Cannot request more than 100 tokens at once')
})), async (c) => {
  try {
    const session = c.get('session');
    const user = session?.user;
    const userId = user?.id;

    if (!userId) {
      return c.json({
        success: false,
        error: 'User authentication required'
      }, 401);
    }

    const { requestedAmount } = c.req.valid('json');
    const { reason } = c.req.valid('json');

    // For now, automatically approve requests
    // In a real implementation, this might require admin approval
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const quota = await getCurrentQuota(String(userId), currentMonth);

    if (!quota) {
      return c.json({
        success: false,
        error: 'No existing quota found'
      }, 404);
    }

    // Increase the quota
    const updatedQuota = await updateGenerationQuota(quota.id, {
      totalAllowed: quota.totalAllowed + requestedAmount
    });

    return c.json({
      success: true,
      data: updatedQuota,
      message: `Successfully added ${requestedAmount} tokens to your quota. Reason: ${reason}`
    });

  } catch (error) {
    console.error('Error requesting additional tokens:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process token request'
    }, 500);
  }
});

// GET /api/quota/history - Get usage history
quotaRouter.get('/history', zValidator('query', z.object({
  months: z.coerce.number().min(1).max(12).default(6)
})), async (c) => {
  try {
    const session = c.get('session');
    const user = session?.user;
    const userId = user?.id;

    if (!userId) {
      return c.json({
        success: false,
        error: 'User authentication required'
      }, 401);
    }

    const { months } = c.req.valid('query');

    // For now, return mock history data
    // In a real implementation, this would query the database for historical usage
    const history = Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      return {
        month: date.toISOString().slice(0, 7),
        totalAllowed: 20,
        generationsUsed: Math.floor(Math.random() * 20),
        plansGenerated: Math.floor(Math.random() * 15)
      };
    }).reverse();

    return c.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching usage history:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch usage history'
    }, 500);
  }
});

// Helper functions
function getNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0] || '';
}