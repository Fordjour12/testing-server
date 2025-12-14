import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  date
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// GENERATION QUOTA Table (Subscription/Billing Management)
export const generationQuota = pgTable('generation_quota', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),

  monthYear: date('month_year').notNull(), // Role: Defines the period the quota applies to.
  totalAllowed: integer('total_allowed').notNull(),
  generationsUsed: integer('generations_used').notNull().default(0),
  resetsOn: date('resets_on').notNull(),
});

export const quotaRelations = relations(generationQuota, ({ one }) => ({
  user: one(user, {
    fields: [generationQuota.userId],
    references: [user.id],
  }),
}));