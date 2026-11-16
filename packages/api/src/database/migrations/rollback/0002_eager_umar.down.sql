-- Rollback for 0002_eager_umar.sql (interlinear layer). Apply manually, then delete the
-- matching row from drizzle.__drizzle_migrations.
DROP TABLE IF EXISTS "original_words";
DROP TABLE IF EXISTS "lexicon_entries";
