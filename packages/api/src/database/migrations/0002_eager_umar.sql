CREATE TABLE "lexicon_entries" (
	"strong" text PRIMARY KEY NOT NULL,
	"lang" text NOT NULL,
	"lemma" text NOT NULL,
	"transliteration" text,
	"morph" text,
	"gloss" text,
	"meaning" text
);
--> statement-breakpoint
CREATE TABLE "original_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"position" integer NOT NULL,
	"lang" text NOT NULL,
	"surface" text NOT NULL,
	"transliteration" text,
	"gloss" text,
	"strong" text,
	"morph" text,
	"lemma" text
);
--> statement-breakpoint
ALTER TABLE "original_words" ADD CONSTRAINT "original_words_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "original_words_verse_pos_uq" ON "original_words" USING btree ("book_id","chapter_number","verse_number","position");--> statement-breakpoint
CREATE INDEX "original_words_chapter_idx" ON "original_words" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE INDEX "original_words_strong_idx" ON "original_words" USING btree ("strong");