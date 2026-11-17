CREATE TABLE "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"content" text NOT NULL,
	"feedback_status" text DEFAULT 'pending' NOT NULL,
	"feedback" jsonb,
	"feedback_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reflections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reflections_user_chapter_idx" ON "reflections" USING btree ("user_id","book_id","chapter_number");--> statement-breakpoint
CREATE POLICY "user_select_own_reflections" ON "reflections" AS PERMISSIVE FOR SELECT TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_insert_own_reflections" ON "reflections" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_update_own_reflections" ON "reflections" AS PERMISSIVE FOR UPDATE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_delete_own_reflections" ON "reflections" AS PERMISSIVE FOR DELETE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);