import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean
} from 'drizzle-orm/pg-core';
import { monthlyPlans } from './monthly-plans';

// PLAN TASKS Table (Individual Scheduled Activities)
export const planTasks = pgTable('plan_tasks', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').references(() => monthlyPlans.id).notNull(),

  taskDescription: text('task_description').notNull(),
  focusArea: varchar('focus_area', { length: 50 }).notNull(),

  startTime: timestamp('start_time').notNull(), // Role: The specific scheduled date and time.
  endTime: timestamp('end_time').notNull(),

  difficultyLevel: varchar('difficulty_level', { length: 20 }), // Role: AI-assigned difficulty based on history.
  schedulingReason: varchar('scheduling_reason', { length: 100 }), // Role: Explanation for timing (e.g., 'Peak Energy Window').

  isCompleted: boolean('is_completed').notNull().default(false), // Role: User tracking for the in-app calendar view.
  completedAt: timestamp('completed_at'), // Role: When the task was actually completed.
});

export const tasksRelations = relations(planTasks, ({ one, many }) => ({
  plan: one(monthlyPlans, {
    fields: [planTasks.planId],
    references: [monthlyPlans.id],
  }),
  history: many(() => import('./user-activity-history').userActivityHistory),
}));