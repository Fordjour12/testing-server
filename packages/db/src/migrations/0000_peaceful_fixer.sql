CREATE TYPE "public"."complexity" AS ENUM('Simple', 'Balanced', 'Ambitious');--> statement-breakpoint
CREATE TYPE "public"."insight_type" AS ENUM('PeakEnergy', 'CompletionRate', 'SessionDuration', 'Challenges');--> statement-breakpoint
CREATE TYPE "public"."weekend_preference" AS ENUM('Work', 'Rest', 'Mixed');--> statement-breakpoint
CREATE TABLE "ai_request_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_payload" jsonb NOT NULL,
	"response_timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_quota" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"month_year" date NOT NULL,
	"total_allowed" integer NOT NULL,
	"generations_used" integer DEFAULT 0 NOT NULL,
	"resets_on" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_goals_and_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goals_text" text NOT NULL,
	"task_complexity" "complexity" NOT NULL,
	"focus_areas" varchar(150) NOT NULL,
	"weekend_preference" "weekend_preference" NOT NULL,
	"fixed_commitments_json" jsonb NOT NULL,
	"input_saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"preference_id" integer NOT NULL,
	"month_year" date NOT NULL,
	"ai_prompt" text NOT NULL,
	"ai_response_raw" jsonb NOT NULL,
	"monthly_summary" text,
	"raw_ai_response" text,
	"extraction_confidence" integer DEFAULT 0,
	"extraction_notes" text,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"task_description" text NOT NULL,
	"focus_area" varchar(50) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"difficulty_level" varchar(20),
	"scheduling_reason" varchar(100),
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_activity_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" integer NOT NULL,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"duration_deviation" integer,
	"was_completed" boolean NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_productivity_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"insight_type" "insight_type" NOT NULL,
	"insight_value_json" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_quota" ADD CONSTRAINT "generation_quota_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals_and_preferences" ADD CONSTRAINT "user_goals_and_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_preference_id_user_goals_and_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."user_goals_and_preferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_plan_id_monthly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."monthly_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_history" ADD CONSTRAINT "user_activity_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_history" ADD CONSTRAINT "user_activity_history_task_id_plan_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."plan_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_productivity_insights" ADD CONSTRAINT "user_productivity_insights_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");