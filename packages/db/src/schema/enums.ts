import { pgEnum } from 'drizzle-orm/pg-core';

// Enums for constrained values - Define enums for cleaner and type-safe data
export const complexityEnum = pgEnum('complexity', ['Simple', 'Balanced', 'Ambitious']);
export const weekendEnum = pgEnum('weekend_preference', ['Work', 'Rest', 'Mixed']);
export const insightTypeEnum = pgEnum('insight_type', ['PeakEnergy', 'CompletionRate', 'SessionDuration', 'Challenges']);