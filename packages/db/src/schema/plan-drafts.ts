import { relations } from 'drizzle-orm';
import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	jsonb
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { userGoalsAndPreferences } from './user-goals-and-preferences';

/**
 * PLAN DRAFTS Table
 * 
 * Stores auto-staged plan drafts that survive page refreshes.
 * This is the simplified replacement for the over-complicated plan_staging table.
 * 
 * Purpose: When a plan is generated, it's automatically saved here as a draft.
 * The user can then review it, and if they refresh the page, the draft persists.
 * Once the user confirms, the draft is moved to monthly_plans and deleted from here.
 */
export const planDrafts = pgTable('plan_drafts', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	draftKey: text('draft_key').notNull().unique(),

	// The actual plan data (JSON) - this is what gets shown in the preview
	planData: jsonb('plan_data').notNull(),

	// Reference to the preferences used for generation
	goalPreferenceId: integer('goal_preference_id').references(() => userGoalsAndPreferences.id),
	monthYear: text('month_year').notNull(), // '2024-01-01' format

	// Simple metadata
	createdAt: timestamp('created_at').notNull().defaultNow(),
	expiresAt: timestamp('expires_at').notNull(),
});

export const planDraftsRelations = relations(planDrafts, ({ one }) => ({
	user: one(user, {
		fields: [planDrafts.userId],
		references: [user.id],
	}),
	preferences: one(userGoalsAndPreferences, {
		fields: [planDrafts.goalPreferenceId],
		references: [userGoalsAndPreferences.id],
	}),
}));
