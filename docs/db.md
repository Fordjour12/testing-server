# DB

 Using **Drizzle ORM** allows you to define your database schema using TypeScript/JavaScript syntax, which is much cleaner and allows for better type safety than raw SQL. We will use Drizzle's syntax to define the tables and relationships.

Here is the Drizzle PostgreSQL schema definition, complete with detailed comments on the role of each table and column.

## 💧 Drizzle PostgreSQL Schema Definition

We'll use Drizzle's `pgTable` for PostgreSQL, `serial` for auto-incrementing IDs, `timestamp` for dates, and `jsonb` for structured data where appropriate (like storing insights and commitments).

```typescript
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  date,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums for constrained values ---
// Define enums for cleaner and type-safe data
export const complexityEnum = pgEnum('complexity', ['Simple', 'Balanced', 'Ambitious']);
export const weekendEnum = pgEnum('weekend_preference', ['Work', 'Rest', 'Mixed']);
export const insightTypeEnum = pgEnum('insight_type', ['PeakEnergy', 'CompletionRate', 'SessionDuration', 'Challenges']);

// ====================================================================
// 1. USERS Table (Core Account Information)
// ====================================================================

there is an existing user table in schema/auth.ts

export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userGoalsAndPreferences),
  plans: many(monthlyPlans),
  quota: many(generationQuota),
  history: many(userActivityHistory),
  insights: many(userProductivityInsights),
}));

// ====================================================================
// 2. USER GOALS AND PREFERENCES Table (Planning Input Data)
// ====================================================================

export const userGoalsAndPreferences = pgTable('user_goals_and_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // UI Inputs
  goalsText: text('goals_text').notNull(),
  taskComplexity: complexityEnum('task_complexity').notNull(), // Role: Influences the AI's selection of task size/difficulty.
  focusAreas: varchar('focus_areas', { length: 150 }).notNull(), // Stored as a comma-separated string or JSON array.
  weekendPreference: weekendEnum('weekend_preference').notNull(),
  
  // Constraints
  fixedCommitmentsJson: jsonb('fixed_commitments_json').notNull(), // Role: Structured weekly recurring busy slots for the AI to avoid.
  
  inputSavedAt: timestamp('input_saved_at').notNull().defaultNow(),
});

export const preferencesRelations = relations(userGoalsAndPreferences, ({ one, many }) => ({
  user: one(users, {
    fields: [userGoalsAndPreferences.userId],
    references: [users.id],
  }),
  plans: many(monthlyPlans),
}));

// ====================================================================
// 3. GENERATION QUOTA Table (Subscription/Billing Management)
// ====================================================================

export const generationQuota = pgTable('generation_quota', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  monthYear: date('month_year').notNull(), // Role: Defines the period the quota applies to.
  totalAllowed: integer('total_allowed').notNull(),
  generationsUsed: integer('generations_used').notNull().default(0),
  resetsOn: date('resets_on').notNull(),
});

export const quotaRelations = relations(generationQuota, ({ one }) => ({
  user: one(users, {
    fields: [generationQuota.userId],
    references: [users.id],
  }),
}));

// ====================================================================
// 4. MONTHLY PLANS Table (AI Generated Plan Summary)
// ====================================================================

export const monthlyPlans = pgTable('monthly_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  preferenceId: integer('preference_id').references(() => userGoalsAndPreferences.id).notNull(), // Role: Links the plan to the exact input used.
  
  monthYear: date('month_year').notNull(),
  aiPrompt: text('ai_prompt').notNull(), // Role: Stores the full context/prompt for debugging and audit.
  aiResponseRaw: jsonb('ai_response_raw').notNull(), // Role: Stores the full JSON output from the AI (including weekly_breakdown, etc.).
  monthlySummary: text('monthly_summary'), // Extracted for easy display.

  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});

export const plansRelations = relations(monthlyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [monthlyPlans.userId],
    references: [users.id],
  }),
  preferences: one(userGoalsAndPreferences, {
    fields: [monthlyPlans.preferenceId],
    references: [userGoalsAndPreferences.id],
  }),
  tasks: many(planTasks),
}));

// ====================================================================
// 5. PLAN TASKS Table (Individual Scheduled Activities)
// ====================================================================

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
});

export const tasksRelations = relations(planTasks, ({ one, many }) => ({
  plan: one(monthlyPlans, {
    fields: [planTasks.planId],
    references: [monthlyPlans.id],
  }),
  history: many(userActivityHistory),
}));


// ====================================================================
// 6. USER ACTIVITY HISTORY Table (Input for AI Personalization)
// ====================================================================

export const userActivityHistory = pgTable('user_activity_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  taskId: integer('task_id').references(() => planTasks.id).notNull(), // Role: Tracks execution of a specific task instance.
  
  actualStartTime: timestamp('actual_start_time'), // Role: Used to calculate accurate session duration.
  actualEndTime: timestamp('actual_end_time'),
  
  durationDeviation: integer('duration_deviation'), // Role: Difference (in minutes) between planned and actual duration.
  wasCompleted: boolean('was_completed').notNull(), // Role: Crucial for calculating historical completion rates.
  
  loggedAt: timestamp('logged_at').notNull().defaultNow(),
});

export const historyRelations = relations(userActivityHistory, ({ one }) => ({
  user: one(users, {
    fields: [userActivityHistory.userId],
    references: [users.id],
  }),
  task: one(planTasks, {
    fields: [userActivityHistory.taskId],
    references: [planTasks.id],
  }),
}));


// ====================================================================
// 7. USER PRODUCTIVITY INSIGHTS Table (AI Context Data)
// ====================================================================

export const userProductivityInsights = pgTable('user_productivity_insights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  insightType: insightTypeEnum('insight_type').notNull(), // e.g., 'PeakEnergy', 'CompletionRate'
  insightValueJson: jsonb('insight_value_json').notNull(), // Role: Structured pattern data (e.g., best time slots: [09:00-11:00]).
  
  lastUpdated: timestamp('last_updated').notNull().defaultNow(), // Role: Timestamp to check staleness of context data.
});

export const insightsRelations = relations(userProductivityInsights, ({ one }) => ({
  user: one(users, {
    fields: [userProductivityInsights.userId],
    references: [users.id],
  }),
}));
```
