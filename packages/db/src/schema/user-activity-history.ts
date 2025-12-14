import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { planTasks } from './plan-tasks';

// USER ACTIVITY HISTORY Table (Input for AI Personalization)
export const userActivityHistory = pgTable('user_activity_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  taskId: integer('task_id').references(() => planTasks.id).notNull(), // Role: Tracks execution of a specific task instance.

  actualStartTime: timestamp('actual_start_time'), // Role: Used to calculate accurate session duration.
  actualEndTime: timestamp('actual_end_time'),

  durationDeviation: integer('duration_deviation'), // Role: Difference (in minutes) between planned and actual duration.
  wasCompleted: boolean('was_completed').notNull(), // Role: Crucial for calculating historical completion rates.

  loggedAt: timestamp('logged_at').notNull().defaultNow(),
});

export const historyRelations = relations(userActivityHistory, ({ one }) => ({
  user: one(user, {
    fields: [userActivityHistory.userId],
    references: [user.id],
  }),
  task: one(planTasks, {
    fields: [userActivityHistory.taskId],
    references: [planTasks.id],
  }),
}));