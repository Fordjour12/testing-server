import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { insightTypeEnum } from './enums';

// USER PRODUCTIVITY INSIGHTS Table (AI Context Data)
export const userProductivityInsights = pgTable('user_productivity_insights', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),

  insightType: insightTypeEnum('insight_type').notNull(), // e.g., 'PeakEnergy', 'CompletionRate'
  insightValueJson: jsonb('insight_value_json').notNull(), // Role: Structured pattern data (e.g., best time slots: [09:00-11:00]).

  lastUpdated: timestamp('last_updated').notNull().defaultNow(), // Role: Timestamp to check staleness of context data.
});

export const insightsRelations = relations(userProductivityInsights, ({ one }) => ({
  user: one(user, {
    fields: [userProductivityInsights.userId],
    references: [user.id],
  }),
}));