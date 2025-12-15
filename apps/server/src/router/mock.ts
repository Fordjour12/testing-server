import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const mockRouter = new Hono();

// Mock data for testing
const mockPlans = new Map<string, any>();

// Schemas matching the frontend variations
const envAwareSchema = z.object({
  goals: z.string().min(1),
  complexity: z.enum(['Simple', 'Moderate', 'Ambitious']),
  focusAreas: z.string().min(1),
  weekendPreference: z.enum(['Deep Work', 'Strategic Planning', 'Learning & Development', 'Light Tasks', 'Rest & Recharge']),
  fixedCommitments: z.array(z.string()).default([]),
  month: z.string().optional(),
});

const classicFetchSchema = z.object({
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

const savePlanSchema = z.object({
  planId: z.string()
});

// Helper function to generate mock plan data
function generateMockPlan(data: any, planId: string) {
  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Finance'];
  const priorities = ['High', 'Medium', 'Low'];

  const tasks = Array.from({ length: 15 }, (_, i) => ({
    id: `task-${i + 1}`,
    title: `${data.focusAreas?.split(',')[0]?.trim() || 'Task'} ${i + 1}`,
    description: `Detailed task description for ${data.focusAreas || 'general work'}`,
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    estimatedHours: Math.floor(Math.random() * 8) + 1,
  }));

  return {
    id: planId,
    title: `${data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Plan`,
    month: data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    goals: data.goals ? data.goals.split('\n').filter(goal => goal.trim().length > 0) : [],
    tasks,
    totalTasks: tasks.length,
    estimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    successRate: Math.floor(Math.random() * 30) + 70,
  };
}

// POST /api/mock/plan/generate - For environment-aware variation
mockRouter.post('/plan/generate', zValidator('json', envAwareSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const planId = `mock-plan-${Date.now()}`;
    const mockPlan = generateMockPlan(data, planId);

    // Store for later retrieval
    mockPlans.set(planId, mockPlan);

    return c.json({
      success: true,
      data: mockPlan,
      planId,
      message: 'Mock plan generated successfully'
    });

  } catch (error) {
    console.error('Error in mock generate:', error);
    return c.json({
      success: false,
      error: 'Failed to generate mock plan'
    }, 500);
  }
});

// POST /api/mock/plan/save - For both variations
mockRouter.post('/plan/save', zValidator('json', savePlanSchema), async (c) => {
  try {
    const { planId } = c.req.valid('json');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const plan = mockPlans.get(planId);

    if (!plan) {
      return c.json({
        success: false,
        error: 'Plan not found'
      }, 404);
    }

    // In a real app, this would save to database
    console.log(`Mock saving plan: ${planId}`);

    return c.json({
      success: true,
      message: 'Plan saved successfully!',
      planId
    });

  } catch (error) {
    console.error('Error in mock save:', error);
    return c.json({
      success: false,
      error: 'Failed to save mock plan'
    }, 500);
  }
});

// GET /api/mock/plan/:planId - Get plan by ID
mockRouter.get('/plan/:planId', async (c) => {
  try {
    const planId = c.req.param('planId');
    const plan = mockPlans.get(planId);

    if (!plan) {
      return c.json({
        success: false,
        error: 'Plan not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Error fetching mock plan:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch mock plan'
    }, 500);
  }
});

// POST /api/mock/plan/inputs - For classic fetch variation
mockRouter.post('/plan/inputs', zValidator('json', classicFetchSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const planId = `mock-plan-${Date.now()}`;

    // Convert classic fetch format to mock plan format
    const convertedData = {
      goals: data.goalsText,
      complexity: data.taskComplexity === 'Balanced' ? 'Moderate' : data.taskComplexity,
      focusAreas: data.focusAreas,
      weekendPreference: data.weekendPreference === 'Mixed' ? 'Strategic Planning' :
                         data.weekendPreference === 'Work' ? 'Deep Work' : 'Rest & Recharge',
      fixedCommitments: data.fixedCommitmentsJson.commitments.map(c => c.description),
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    const mockPlan = generateMockPlan(convertedData, planId);

    // Store for later retrieval
    mockPlans.set(planId, mockPlan);

    return c.json({
      success: true,
      planId,
      message: 'Mock planning inputs saved and plan generated successfully'
    });

  } catch (error) {
    console.error('Error in mock inputs:', error);
    return c.json({
      success: false,
      error: 'Failed to save mock planning inputs'
    }, 500);
  }
});

// DELETE /api/mock/plan/:planId - Delete a plan
mockRouter.delete('/plan/:planId', async (c) => {
  try {
    const planId = c.req.param('planId');
    const deleted = mockPlans.delete(planId);

    if (!deleted) {
      return c.json({
        success: false,
        error: 'Plan not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting mock plan:', error);
    return c.json({
      success: false,
      error: 'Failed to delete mock plan'
    }, 500);
  }
});

// GET /api/mock/plans - List all mock plans
mockRouter.get('/plans', async (c) => {
  try {
    const plans = Array.from(mockPlans.entries()).map(([id, plan]) => ({
      id,
      title: plan.title,
      month: plan.month,
      totalTasks: plan.totalTasks,
      estimatedHours: plan.estimatedHours,
      createdAt: new Date().toISOString()
    }));

    return c.json({
      success: true,
      data: plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Error listing mock plans:', error);
    return c.json({
      success: false,
      error: 'Failed to list mock plans'
    }, 500);
  }
});

// Health check endpoint
mockRouter.get('/health', async (c) => {
  return c.json({
    success: true,
    message: 'Mock router is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/mock/plan/generate - Environment-aware generation',
      'POST /api/mock/plan/save - Save plan',
      'GET /api/mock/plan/:id - Get plan by ID',
      'POST /api/mock/plan/inputs - Classic fetch input processing',
      'GET /api/mock/plans - List all plans',
      'DELETE /api/mock/plan/:id - Delete plan'
    ]
  });
});