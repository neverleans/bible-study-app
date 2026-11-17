import { z } from 'zod';
import type { ReflectionFeedback } from '../../database/schema/reflections';

export const REFLECTION_MIN_CHARS = 40;
export const REFLECTION_MAX_CHARS = 2000;

const listOfText = z.array(z.string().trim().min(3).max(300)).max(6);

const feedbackSchema = z.object({
  coveredPoints: listOfText,
  missingPoints: listOfText,
  misunderstandings: z
    .array(
      z.object({
        claim: z.string().trim().min(3).max(300),
        correction: z.string().trim().min(3).max(400),
        verse: z.number().int().min(1),
      }),
    )
    .max(4),
  encouragement: z.string().trim().min(5).max(400),
});

/**
 * Validates the model's feedback. A correction must cite a verse that exists in the chapter,
 * otherwise it could not be checked against the text, so it is rejected and the job retries.
 */
export function parseReflectionFeedback(raw: unknown, verseCount: number): ReflectionFeedback {
  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Feedback inválido da IA: ${parsed.error.issues[0]?.message ?? 'formato incorreto'}`,
    );
  }
  for (const m of parsed.data.misunderstandings) {
    if (m.verse > verseCount) {
      throw new Error(
        `Feedback inválido da IA: cita o versículo ${m.verse} (o capítulo tem ${verseCount}).`,
      );
    }
  }
  return parsed.data;
}
