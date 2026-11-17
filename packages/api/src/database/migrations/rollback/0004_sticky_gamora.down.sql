-- Rollback for 0004_sticky_gamora.sql (review_cards). Apply manually, then delete the matching row from
-- drizzle.__drizzle_migrations.
DROP TABLE IF EXISTS "review_cards";
