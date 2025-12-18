import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  date,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { userGoalsAndPreferences } from './user-goals-and-preferences';

// MONTHLY PLANS Table (AI Generated Plan Summary)
export const monthlyPlans = pgTable('monthly_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  preferenceId: integer('preference_id').references(() => userGoalsAndPreferences.id).notNull(), // Role: Links the plan to the exact input used.

  monthYear: date('month_year').notNull(),
  aiPrompt: text('ai_prompt').notNull(), // Role: Stores the full context/prompt for debugging and audit.
  aiResponseRaw: jsonb('ai_response_raw').notNull(), // Role: Stores the full JSON output from the AI (including weekly_breakdown, etc.).
  monthlySummary: text('monthly_summary'), // Extracted for easy display.
  rawAiResponse: text('raw_ai_response'), // Store complete AI response as text for robust extraction
  extractionConfidence: integer('extraction_confidence').default(0), // Quality score (0-100)
  extractionNotes: text('extraction_notes'), // Processing metadata and notes

  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});

export const plansRelations = relations(monthlyPlans, ({ one }) => ({
  user: one(user, {
    fields: [monthlyPlans.userId],
    references: [user.id],
  }),
  preferences: one(userGoalsAndPreferences, {
    fields: [monthlyPlans.preferenceId],
    references: [userGoalsAndPreferences.id],
  }),
}));