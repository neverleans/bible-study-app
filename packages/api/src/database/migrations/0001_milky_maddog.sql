CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "highlights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "highlights_user_id_idx" ON "highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "highlights_book_chapter_idx" ON "highlights" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE UNIQUE INDEX "highlights_user_verse_uq" ON "highlights" USING btree ("user_id","book_id","chapter_number","verse_number");--> statement-breakpoint
CREATE INDEX "reading_progress_user_id_idx" ON "reading_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_progress_user_chapter_uq" ON "reading_progress" USING btree ("user_id","book_id","chapter_number");--> statement-breakpoint
CREATE POLICY "user_select_own_highlights" ON "highlights" AS PERMISSIVE FOR SELECT TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_insert_own_highlights" ON "highlights" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_update_own_highlights" ON "highlights" AS PERMISSIVE FOR UPDATE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_delete_own_highlights" ON "highlights" AS PERMISSIVE FOR DELETE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_select_own_progress" ON "reading_progress" AS PERMISSIVE FOR SELECT TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_insert_own_progress" ON "reading_progress" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_update_own_progress" ON "reading_progress" AS PERMISSIVE FOR UPDATE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_delete_own_progress" ON "reading_progress" AS PERMISSIVE FOR DELETE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);