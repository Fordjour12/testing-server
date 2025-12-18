import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { complexityEnum, weekendEnum } from './enums';

// USER GOALS AND PREFERENCES Table (Planning Input Data)
export const userGoalsAndPreferences = pgTable('user_goals_and_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),

  // UI Inputs
  goalsText: text('goals_text').notNull(),
  taskComplexity: complexityEnum('task_complexity').notNull(), // Role: Influences the AI's selection of task size/difficulty.
  focusAreas: varchar('focus_areas', { length: 150 }).notNull(), // Stored as a comma-separated string or JSON array.
  weekendPreference: weekendEnum('weekend_preference').notNull(),

  // Constraints
  fixedCommitmentsJson: jsonb('fixed_commitments_json').notNull(), // Role: Structured weekly recurring busy slots for the AI to avoid.

  inputSavedAt: timestamp('input_saved_at').notNull().defaultNow(),
});

export const preferencesRelations = relations(userGoalsAndPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userGoalsAndPreferences.userId],
    references: [user.id],
  }),
}));