import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// PLAN STAGING Table (Temporary Plan Storage for Preview-Save Workflow)
export const planStaging = pgTable('plan_staging', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  timestamp: timestamp('created_at').notNull().defaultNow(),
  stagingKey: text('staging_key').notNull().unique(), // userId + timestamp composite key
  planData: jsonb('plan_data').notNull(), // Formatted plan data ready for display
  extractionConfidence: integer('extraction_confidence'), // 0-100 confidence score
  extractionNotes: text('extraction_notes'), // Processing metadata
  aiResponseRaw: jsonb('ai_response_raw'), // Raw AI response for debugging
  expiresAt: timestamp('expires_at').notNull(), // When this staging record expires
  isSaved: boolean('is_saved').default(false), // Whether user has saved this plan
  savedAt: timestamp('saved_at'), // When user saved the plan
  monthYear: text('month_year').notNull(), // The month this plan is for
  preferencesId: integer('preferences_id'), // Reference to user preferences used
});

export const planStagingRelations = relations(planStaging, ({ one }) => ({
  user: one(user, {
    fields: [planStaging.userId],
    references: [user.id],
  }),
}));