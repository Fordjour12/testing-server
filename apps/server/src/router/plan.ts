import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   createGoalPreference,
   getLatestGoalPreference,
   getCurrentMonthlyPlanWithTasks,
   updateTaskStatus as updateTaskStatusQuery,
   logActivity as logActivityQuery
} from '@testing-server/db';
import type { Variables } from '../index';

export const planRouter = new Hono<{ Variables: Variables }>();

// Zod schemas for validation
const createPlanInputSchema = z.object({
   userId: z.string(),
   goalsText: z.string().min(1),
   taskComplexity: z.enum(['Simple', 'Balanced', 'Ambitious']),
   focusAreas: z.string().min(1),
   weekendPreference: z.enum(['Work', 'Rest', 'Mixed']),
   fixedCommitmentsJson: z.object({
      commitments: z.array(z.object({
         dayOfWeek: z.string(),
         startTime: z.string(),
         endTime: z.string(),
         description: z.string()
      }))
   })
});

const updateTaskSchema = z.object({
   isCompleted: z.boolean()
});

planRouter.get('/', async (c) => {
   return c.json({
      message: "Okay! from /api/plan"
   })
})

// POST /api/plan/inputs - Save planning inputs and trigger AI generation
planRouter.post('/inputs', zValidator('json', createPlanInputSchema), async (c) => {
   try {
      const data = c.req.valid('json');

      console.log("data user sent to server data", data)

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
         return c.json({
            success: false,
            error: 'Failed to save planning inputs'
         }, 500);
      }

      // 2. Trigger AI Plan Generation via internal service call
      // This is the proper architecture: public API → internal service
      try {
         // Make internal HTTP call to /service/generate
         const baseUrl = process.env.API_BASE_URL;
         const response = await fetch(`${baseUrl}/service/generate`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               preferenceId: newPreference.id,
               userId: data.userId
            })
         });

         const result = await response.json();
         console.log("result", result)

         if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate plan');
         }

         // 3. Return success response with staging key (Approach 2: Staging Table)
         return c.json({
            success: true,
            preferenceId: newPreference.id,
            data: result.data, // Contains stagingKey, stagingPlan, expiresAt
            message: 'Planning inputs saved and plan staged for preview'
         });
      } catch (generationError) {
         console.error('Error during plan generation:', generationError);
         // Still return success for saving preferences, but note generation failed
         return c.json({
            success: true,
            preferenceId: newPreference.id,
            warning: 'Planning inputs saved but AI generation failed',
            error: generationError instanceof Error ? generationError.message : 'Unknown generation error'
         });
      }

   } catch (error) {
      console.error('Error saving plan inputs:', error);
      return c.json({
         success: false,
         error: 'Failed to save planning inputs'
      }, 500);
   }
});


// POST /api/plan/save - Server function for saving plans
planRouter.post('/save', zValidator('json', z.object({
   planId: z.string()
})), async (c) => {
   try {
      const { planId } = c.req.valid('json');

      // In a real implementation, you might update a "saved" flag or perform additional save operations
      // For now, we'll just log the save action since plans are already saved in the database
      console.log(`Plan ${planId} save action completed via server function`);

      return c.json({
         success: true,
         message: 'Plan saved successfully!'
      });

   } catch (error) {
      console.error('Error saving plan via server function:', error);
      return c.json({
         success: false,
         error: error instanceof Error ? error.message : 'Failed to save plan'
      }, 500);
   }
});


// GET /api/plan/inputs/latest - Get latest planning inputs for a user
planRouter.get('/inputs/latest', async (c) => {
   try {
      const userId = c.req.query('userId');
      if (!userId) {
         return c.json({ error: 'userId is required' }, 400);
      }

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

// GET /api/plan/current - Get the active monthly plan
planRouter.get('/current', async (c) => {
   try {
      const userId = c.req.query('userId');
      if (!userId) {
         return c.json({ error: 'userId is required' }, 400);
      }

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

// PATCH /api/plan/tasks/:taskId - Update task status
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
