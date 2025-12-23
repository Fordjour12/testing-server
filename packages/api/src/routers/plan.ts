/**
 * Plan Router - Hybrid Approach (Simplified + Existing Endpoints)
 * 
 * This combines the new simplified hybrid flow with existing endpoints:
 * 
 * NEW SIMPLIFIED ENDPOINTS:
 * - POST /api/plan/generate - Generate and auto-stage a plan
 * - POST /api/plan/confirm - Save a draft to permanent storage
 * - GET /api/plan/draft/:key - Get a specific draft
 * - GET /api/plan/draft - Get user's latest draft (for auto-recovery)
 * - DELETE /api/plan/draft/:key - Discard a draft
 * 
 * EXISTING ENDPOINTS (kept for backward compatibility):
 * - GET /api/plan/current - Get the active monthly plan
 * - PATCH /api/plan/tasks/:taskId - Update task status
 * - GET /api/plan/inputs/latest - Get latest planning inputs
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   getLatestGoalPreference,
   getCurrentMonthlyPlanWithTasks,
   updateTaskStatus as updateTaskStatusQuery,
   logActivity as logActivityQuery,
   getDraft,
   deleteDraft,
   getLatestDraft
} from '@testing-server/db';
import {
   generatePlan,
   confirmPlan
} from '../services/hybrid-plan-generation';

// Type for session context
type Variables = {
   session: {
      user: {
         id: string;
      } | null;
      session: {
         token: string;
      } | null;
   } | null;
}

export const planRouter = new Hono<{ Variables: Variables }>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const generateInputSchema = z.object({
   userId: z.string().optional(), // Optional because we'll get it from session
   goalsText: z.string().min(1, "Goals are required"),
   taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
   focusAreas: z.string().min(1, "Focus areas are required"),
   weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
   fixedCommitmentsJson: z.object({
      commitments: z.array(
         z.object({
            dayOfWeek: z.string(),
            startTime: z.string(),
            endTime: z.string(),
            description: z.string(),
         })
      ),
   }),
});

const confirmInputSchema = z.object({
   draftKey: z.string().min(1, "Draft key is required")
});

const updateTaskSchema = z.object({
   isCompleted: z.boolean()
});

// ============================================
// NEW SIMPLIFIED HYBRID ENDPOINTS
// ============================================

/**
 * POST /api/plan/generate
 * Generate a new plan and auto-stage it
 */
planRouter.post(
   "/generate",
   zValidator("json", generateInputSchema),
   async (c) => {
      try {
         const data = c.req.valid("json");

         // Get userId from session or use the one from request
         const userId = c.get("session")?.user?.id || data.userId;

         if (!userId) {
            return c.json({
               success: false,
               error: "Authentication required"
            }, 401);
         }

         console.log(`[API] Plan generation request from user: ${userId}`);

         const result = await generatePlan({ ...data, userId });

         if (!result.success) {
            return c.json({
               success: false,
               error: result.error
            }, 500);
         }

         return c.json({
            success: true,
            data: {
               draftKey: result.draftKey,
               planData: result.planData,
               preferenceId: result.preferenceId,
               generatedAt: result.generatedAt,
            },
            message: "Plan generated successfully. Review and save when ready.",
         });
      } catch (error) {
         console.error("[API] Plan generation error:", error);
         return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
         }, 500);
      }
   }
);

/**
 * POST /api/plan/confirm
 * Save a drafted plan permanently
 */
planRouter.post(
   "/confirm",
   zValidator("json", confirmInputSchema),
   async (c) => {
      try {
         const { draftKey } = c.req.valid("json");
         const userId = c.get("session")?.user?.id;

         if (!userId) {
            return c.json({
               success: false,
               error: "Authentication required"
            }, 401);
         }

         console.log(`[API] Plan confirm request from user: ${userId}, draft: ${draftKey}`);

         const result = await confirmPlan(userId, draftKey);

         if (!result.success) {
            return c.json({
               success: false,
               error: result.error
            }, 400);
         }

         return c.json({
            success: true,
            data: { planId: result.planId },
            message: "Plan saved successfully!",
         });
      } catch (error) {
         console.error("[API] Plan confirm error:", error);
         return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
         }, 500);
      }
   }
);

/**
 * GET /api/plan/draft/:key
 * Retrieve a specific draft (for page refresh recovery)
 */
planRouter.get("/draft/:key", async (c) => {
   try {
      const draftKey = c.req.param("key");
      const userId = c.get("session")?.user?.id;

      if (!userId) {
         return c.json({
            success: false,
            error: "Authentication required"
         }, 401);
      }

      console.log(`[API] Get draft request from user: ${userId}, key: ${draftKey}`);

      const draft = await getDraft(userId, draftKey);

      if (!draft) {
         return c.json({
            success: false,
            error: "Draft not found or expired"
         }, 404);
      }

      return c.json({
         success: true,
         data: {
            planData: draft.planData,
            draftKey: draft.draftKey,
            createdAt: draft.createdAt,
            expiresAt: draft.expiresAt,
         },
      });
   } catch (error) {
      console.error("[API] Get draft error:", error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : "Unknown error occurred"
      }, 500);
   }
});

/**
 * GET /api/plan/draft
 * Get latest draft for current user (auto-recovery)
 */
planRouter.get("/draft", async (c) => {
   try {
      const userId = c.get("session")?.user?.id;

      if (!userId) {
         return c.json({
            success: false,
            error: "Authentication required"
         }, 401);
      }

      console.log(`[API] Get latest draft request from user: ${userId}`);

      const draft = await getLatestDraft(userId);

      if (!draft) {
         // No draft is OK - just return null
         return c.json({
            success: true,
            data: null,
            message: "No draft found"
         });
      }

      return c.json({
         success: true,
         data: {
            planData: draft.planData,
            draftKey: draft.draftKey,
            createdAt: draft.createdAt,
            expiresAt: draft.expiresAt,
         },
      });
   } catch (error) {
      console.error("[API] Get latest draft error:", error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : "Unknown error occurred"
      }, 500);
   }
});

/**
 * DELETE /api/plan/draft/:key
 * Discard a draft
 */
planRouter.delete("/draft/:key", async (c) => {
   try {
      const draftKey = c.req.param("key");
      const userId = c.get("session")?.user?.id;

      if (!userId) {
         return c.json({
            success: false,
            error: "Authentication required"
         }, 401);
      }

      console.log(`[API] Delete draft request from user: ${userId}, key: ${draftKey}`);

      await deleteDraft(userId, draftKey);

      return c.json({
         success: true,
         message: "Draft discarded successfully",
      });
   } catch (error) {
      console.error("[API] Delete draft error:", error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : "Unknown error occurred"
      }, 500);
   }
});

// ============================================
// EXISTING ENDPOINTS (Backward Compatibility)
// ============================================

/**
 * GET /api/plan/inputs/latest
 * Get latest planning inputs for a user
 */
planRouter.get('/inputs/latest', async (c) => {
   try {
      const session = c.get('session');

      if (!session?.user?.id) {
         return c.json({ error: 'Authentication required' }, 401);
      }

      const userId = session.user.id;
      const latestPreference = await getLatestGoalPreference(userId);

      if (!latestPreference) {
         return c.json({ error: 'No planning inputs found for this user' }, 404);
      }

      return c.json({ success: true, data: latestPreference });

   } catch (error) {
      console.error('Error fetching latest inputs:', error);
      return c.json({
         success: false,
         error: 'Failed to fetch latest planning inputs'
      }, 500);
   }
});

/**
 * GET /api/plan/current
 * Get the active monthly plan
 */
planRouter.get('/current', async (c) => {
   try {
      const session = c.get('session');

      if (!session?.user?.id) {
         return c.json({ error: 'Authentication required' }, 401);
      }

      const userId = session.user.id;
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      const planWithTasks = await getCurrentMonthlyPlanWithTasks(userId, currentMonth);

      if (!planWithTasks) {
         return c.json({ error: 'No active plan found for current month' }, 404);
      }

      return c.json({ success: true, data: planWithTasks });

   } catch (error) {
      console.error('Error fetching current plan:', error);
      return c.json({
         success: false,
         error: 'Failed to fetch current plan'
      }, 500);
   }
});

/**
 * PATCH /api/plan/tasks/:taskId
 * Update task status
 */
planRouter.patch('/tasks/:taskId', zValidator('json', updateTaskSchema), async (c) => {
   try {
      const taskId = parseInt(c.req.param('taskId'));
      const { isCompleted } = c.req.valid('json');

      if (isNaN(taskId)) {
         return c.json({ error: 'Invalid taskId' }, 400);
      }

      // 1. Update task status
      const updatedTask = await updateTaskStatusQuery(taskId, isCompleted);

      if (!updatedTask) {
         return c.json({ error: 'Task not found' }, 404);
      }

      // 2. Trigger History Logging
      if (isCompleted) {
         await logActivityQuery(taskId);
      }

      return c.json({ success: true, data: updatedTask });

   } catch (error) {
      console.error('Error updating task:', error);
      return c.json({
         success: false,
         error: 'Failed to update task status'
      }, 500);
   }
});

/**
 * GET /api/plan
 * Health check endpoint
 */
planRouter.get('/', async (c) => {
   return c.json({
      message: "Plan API - Hybrid approach active",
      endpoints: {
         new: [
            "POST /api/plan/generate",
            "POST /api/plan/confirm",
            "GET /api/plan/draft/:key",
            "GET /api/plan/draft",
            "DELETE /api/plan/draft/:key"
         ],
         existing: [
            "GET /api/plan/current",
            "PATCH /api/plan/tasks/:taskId",
            "GET /api/plan/inputs/latest"
         ]
      }
   });
});