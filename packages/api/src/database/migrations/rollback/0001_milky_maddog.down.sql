-- Rollback for 0001_milky_maddog.sql (highlights + reading_progress).
-- Drizzle does not run this automatically; apply manually with psql if needed,
-- then delete the matching row from drizzle.__drizzle_migrations.
-- Dropping the tables also drops their indexes, constraints and RLS policies.
DROP TABLE IF EXISTS "highlights";
DROP TABLE IF EXISTS "reading_progress";
