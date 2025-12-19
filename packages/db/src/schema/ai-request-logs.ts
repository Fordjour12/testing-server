import {
  pgTable,
  serial,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';

// AI REQUEST LOGS Table (Raw AI Response Storage)
export const aiRequestLogs = pgTable('ai_request_logs', {
  id: serial('id').primaryKey(),
  responsePayload: jsonb('response_payload').notNull(), // Raw JSON of the AI response
  responseTimestamp: timestamp('response_timestamp').notNull().defaultNow(),
});