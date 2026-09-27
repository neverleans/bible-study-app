CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text,
	"provider" text DEFAULT 'local' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"abbrev" text NOT NULL,
	"name" text NOT NULL,
	"testament" text NOT NULL,
	"chapter_count" integer NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "books_abbrev_unique" UNIQUE("abbrev")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"number" integer NOT NULL,
	"verses" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verses" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" integer NOT NULL,
	"number" integer NOT NULL,
	"text" text NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', "verses"."text")) STORED
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_aids" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer,
	"analysis_type" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"response" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "ai_cache_prompt_hash_unique" UNIQUE("prompt_hash")
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_aids" ADD CONSTRAINT "study_aids_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cache" ADD CONSTRAINT "ai_cache_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chapters_book_number_idx" ON "chapters" USING btree ("book_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "verses_chapter_number_idx" ON "verses" USING btree ("chapter_id","number");--> statement-breakpoint
CREATE INDEX "verses_book_id_idx" ON "verses" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "verses_search_vector_idx" ON "verses" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_book_chapter_idx" ON "notes" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE INDEX "study_aids_book_type_idx" ON "study_aids" USING btree ("book_id","type");--> statement-breakpoint
CREATE INDEX "ai_cache_book_chapter_idx" ON "ai_cache" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE POLICY "user_select_own_notes" ON "notes" AS PERMISSIVE FOR SELECT TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_insert_own_notes" ON "notes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_update_own_notes" ON "notes" AS PERMISSIVE FOR UPDATE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "user_delete_own_notes" ON "notes" AS PERMISSIVE FOR DELETE TO public USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);