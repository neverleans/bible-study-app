import { z } from 'zod';
import type { StoredQuizQuestion } from '../../database/schema/quizzes';

/** Bump when the generation prompt changes so new quizzes live beside the old ones. */
export const QUIZ_PROMPT_VERSION = 1;
export const QUIZ_QUESTION_COUNT = 5;
export const QUIZ_OPTION_COUNT = 4;

const questionSchema = z.object({
  question: z.string().trim().min(10).max(400),
  options: z.array(z.string().trim().min(1).max(200)).length(QUIZ_OPTION_COUNT),
  correctIndex: z.number().int().min(0).max(QUIZ_OPTION_COUNT - 1),
  explanation: z.string().trim().min(10).max(600),
  verse: z.number().int().min(1),
});

const quizSchema = z.object({
  questions: z.array(questionSchema).min(3).max(QUIZ_QUESTION_COUNT + 2),
});

/**
 * Validates what the model returned. Throws with a readable reason so the queue retries
 * instead of storing a broken or misleading quiz.
 */
export function parseQuizQuestions(raw: unknown, verseCount: number): StoredQuizQuestion[] {
  const parsed = quizSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Quiz inválido da IA: ${parsed.error.issues[0]?.message ?? 'formato incorreto'}`);
  }

  const questions = parsed.data.questions;
  for (const [i, q] of questions.entries()) {
    if (q.verse > verseCount) {
      throw new Error(`Quiz inválido da IA: pergunta ${i + 1} cita o versículo ${q.verse} (o capítulo tem ${verseCount}).`);
    }
    if (new Set(q.options.map((o) => o.toLowerCase())).size !== q.options.length) {
      throw new Error(`Quiz inválido da IA: pergunta ${i + 1} tem alternativas repetidas.`);
    }
  }
  return questions;
}
