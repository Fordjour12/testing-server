import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   getStagingPlan,
   markStagingPlanAsSaved,
   deleteStagingPlan,
   saveGeneratedPlan,
   cleanupExpiredStagingPlans
} from '@testing-server/db';
import type { Variables } from '../index';

export const stagingRouter = new Hono<{ Variables: Variables }>();

// GET /api/staging/:stagingKey - Get staged plan for preview
stagingRouter.get('/:stagingKey', async (c) => {
   try {
      const stagingKey = c.req.param('stagingKey');

      if (!stagingKey) {
         return c.json({ error: 'stagingKey is required' }, 400);
      }

      const stagingPlan = await getStagingPlan(stagingKey);

      if (!stagingPlan) {
         return c.json({ error: 'Staged plan not found or expired' }, 404);
      }

      // Check if plan has expired
      if (new Date() > new Date(stagingPlan.expiresAt)) {
         await deleteStagingPlan(stagingKey);
         return c.json({ error: 'Staged plan has expired' }, 410);
      }

      return c.json({
         success: true,
         data: {
            stagingKey: stagingPlan.stagingKey,
            planData: stagingPlan.planData,
            extractionConfidence: stagingPlan.extractionConfidence,
            extractionNotes: stagingPlan.extractionNotes,
            expiresAt: stagingPlan.expiresAt,
            monthYear: stagingPlan.monthYear,
            preferencesId: stagingPlan.preferencesId
         }
      });

   } catch (error) {
      console.error('Error fetching staged plan:', error);
      return c.json({
         success: false,
         error: 'Failed to fetch staged plan'
      }, 500);
   }
});

// POST /api/staging/:stagingKey/save - Confirm and move staged plan to permanent storage
stagingRouter.post('/:stagingKey/save', zValidator('json', z.object({
   confirmed: z.boolean()
})), async (c) => {
   try {
      const stagingKey = c.req.param('stagingKey');
      const { confirmed } = c.req.valid('json');

      if (!stagingKey) {
         return c.json({ error: 'stagingKey is required' }, 400);
      }

      if (!confirmed) {
         return c.json({ error: 'Plan confirmation is required' }, 400);
      }

      const stagingPlan = await getStagingPlan(stagingKey);

      if (!stagingPlan) {
         return c.json({ error: 'Staged plan not found or expired' }, 404);
      }

      // Check if plan has expired
      if (new Date() > new Date(stagingPlan.expiresAt)) {
         await deleteStagingPlan(stagingKey);
         return c.json({ error: 'Staged plan has expired' }, 410);
      }

      // Save to permanent storage using existing logic
      const planId = await saveGeneratedPlan(
         stagingPlan.userId,
         stagingPlan.preferencesId!,
         stagingPlan.monthYear,
         '', // prompt - could be retrieved if needed
         stagingPlan.aiResponseRaw
      );

      if (!planId) {
         return c.json({ error: 'Failed to save plan to permanent storage' }, 500);
      }

      // Mark staging plan as saved
      await markStagingPlanAsSaved(stagingKey);

      return c.json({
         success: true,
         planId,
         message: 'Plan saved successfully to permanent storage'
      });

   } catch (error) {
      console.error('Error saving staged plan:', error);
      return c.json({
         success: false,
         error: 'Failed to save staged plan'
      }, 500);
   }
});

// DELETE /api/staging/:stagingKey - Discard staged plan
stagingRouter.delete('/:stagingKey', async (c) => {
   try {
      const stagingKey = c.req.param('stagingKey');

      if (!stagingKey) {
         return c.json({ error: 'stagingKey is required' }, 400);
      }

      const deletedPlan = await deleteStagingPlan(stagingKey);

      if (!deletedPlan) {
         return c.json({ error: 'Staged plan not found' }, 404);
      }

      return c.json({
         success: true,
         message: 'Staged plan discarded successfully'
      });

   } catch (error) {
      console.error('Error discarding staged plan:', error);
      return c.json({
         success: false,
         error: 'Failed to discard staged plan'
      }, 500);
   }
});

// POST /api/staging/cleanup - Clean up expired staging plans (admin/utility endpoint)
stagingRouter.post('/cleanup', async (c) => {
   try {
      const deletedPlans = await cleanupExpiredStagingPlans();

      return c.json({
         success: true,
         data: {
            deletedCount: deletedPlans.length,
            deletedPlans: deletedPlans.map(plan => ({
               stagingKey: plan.stagingKey,
               userId: plan.userId,
               expiredAt: plan.expiresAt
            }))
         },
         message: `Cleaned up ${deletedPlans.length} expired staging plans`
      });

   } catch (error) {
      console.error('Error cleaning up staging plans:', error);
      return c.json({
         success: false,
         error: 'Failed to cleanup staging plans'
      }, 500);
   }
});