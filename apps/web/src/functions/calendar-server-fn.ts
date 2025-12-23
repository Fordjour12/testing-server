import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const monthSchema = z.object({
  month: z.string()
});

const dateSchema = z.object({
  date: z.string()
});

const taskCompletionSchema = z.object({
  taskId: z.number(),
  isCompleted: z.boolean()
});

export const getTasksForMonth = createServerFn({ method: 'GET' })
  .inputValidator(monthSchema)
  .handler(async ({ data }) => {
    try {
      const response = await fetch('/api/calendar/tasks?' + new URLSearchParams({ month: data.month }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching monthly tasks:', error);
      throw error;
    }
  });

export const getTasksForDay = createServerFn({ method: 'GET' })
  .inputValidator(dateSchema)
  .handler(async ({ data }) => {
    try {
      const response = await fetch('/api/calendar/tasks/day?' + new URLSearchParams({ date: data.date }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  });

export const getFocusAreas = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const response = await fetch('/api/calendar/focus-areas');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch focus areas');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching focus areas:', error);
      throw error;
    }
  });

export const updateTaskCompletion = createServerFn({ method: 'POST' })
  .inputValidator(taskCompletionSchema)
  .handler(async ({ data }) => {
    try {
      const response = await fetch(`/api/calendar/tasks/${data.taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: data.isCompleted })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating task completion:', error);
      throw error;
    }
  });
