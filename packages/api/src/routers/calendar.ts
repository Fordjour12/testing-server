import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getTasksByDateRange,
  getTasksByDay,
  getUniqueFocusAreas,
  updateTaskStatus
} from '@testing-server/db';

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

export const calendarRouter = new Hono<{ Variables: Variables }>();

calendarRouter.get('/tasks', zValidator('query', z.object({
  month: z.string()
})), async (c) => {
  try {
    const { month } = c.req.valid('query');
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const [year, monthNum] = month.split('-').map(Number);

    if (!year || !monthNum || isNaN(year) || isNaN(monthNum)) {
      return c.json({ error: 'Invalid month format' }, 400);
    }

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const tasks = await getTasksByDateRange(userId, startDate, endDate);

    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching monthly tasks:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tasks'
    }, 500);
  }
});

calendarRouter.get('/tasks/day', zValidator('query', z.object({
  date: z.string()
})), async (c) => {
  try {
    const { date } = c.req.valid('query');
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const selectedDate = new Date(date);

    const tasks = await getTasksByDay(userId, selectedDate);

    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tasks'
    }, 500);
  }
});

calendarRouter.get('/focus-areas', async (c) => {
  try {
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const focusAreas = await getUniqueFocusAreas(userId);

    const colorPalette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const focusAreasWithColors = focusAreas.map((fa, i) => ({
      ...fa,
      color: colorPalette[i % colorPalette.length]
    }));

    return c.json({ success: true, data: focusAreasWithColors });
  } catch (error) {
    console.error('Error fetching focus areas:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch focus areas'
    }, 500);
  }
});

calendarRouter.patch('/tasks/:taskId/complete', zValidator('json', z.object({
  isCompleted: z.boolean()
})), async (c) => {
  try {
    const taskId = parseInt(c.req.param('taskId'));
    const { isCompleted } = c.req.valid('json');

    const updatedTask = await updateTaskStatus(taskId, isCompleted, isCompleted ? new Date() : null);

    return c.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    return c.json({
      success: false,
      error: 'Failed to update task status'
    }, 500);
  }
});
