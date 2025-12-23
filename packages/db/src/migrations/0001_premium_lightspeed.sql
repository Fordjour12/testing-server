CREATE TABLE "plan_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"draft_key" text NOT NULL,
	"plan_data" jsonb NOT NULL,
	"goal_preference_id" integer,
	"month_year" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "plan_drafts_draft_key_unique" UNIQUE("draft_key")
);
--> statement-breakpoint
ALTER TABLE "plan_drafts" ADD CONSTRAINT "plan_drafts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_drafts" ADD CONSTRAINT "plan_drafts_goal_preference_id_user_goals_and_preferences_id_fk" FOREIGN KEY ("goal_preference_id") REFERENCES "public"."user_goals_and_preferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_drafts_user_id_idx" ON "plan_drafts" USING btree ("user_id", "expires_at");--> statement-breakpoint
CREATE INDEX "plan_drafts_expires_at_idx" ON "plan_drafts" USING btree ("expires_at");