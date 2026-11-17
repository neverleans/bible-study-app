-- Rollback for 0003_puzzling_plazm.sql (quizzes + quiz_attempts). Apply manually, then delete the
-- matching row from drizzle.__drizzle_migrations. Attempts are dropped first (FK to quizzes).
DROP TABLE IF EXISTS "quiz_attempts";
DROP TABLE IF EXISTS "quizzes";
