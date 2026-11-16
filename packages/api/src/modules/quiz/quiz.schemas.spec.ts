import { parseQuizQuestions } from './quiz.schemas';

const question = (overrides: Record<string, unknown> = {}) => ({
  question: 'Para onde Jonas tentou fugir?',
  options: ['Társis', 'Nínive', 'Jope', 'Egito'],
  correctIndex: 0,
  explanation: 'O texto diz que Jonas se levantou para fugir para Társis.',
  verse: 3,
  ...overrides,
});

const quiz = (qs: unknown[]) => ({ questions: qs });

describe('parseQuizQuestions', () => {
  it('accepts a well-formed quiz', () => {
    const result = parseQuizQuestions(quiz([question(), question(), question()]), 17);
    expect(result).toHaveLength(3);
    expect(result[0].correctIndex).toBe(0);
  });

  it('rejects a quiz with too few questions', () => {
    expect(() => parseQuizQuestions(quiz([question()]), 17)).toThrow(/Quiz inválido/);
  });

  it('rejects a correct index outside the options', () => {
    expect(() =>
      parseQuizQuestions(quiz([question({ correctIndex: 4 }), question(), question()]), 17),
    ).toThrow(/Quiz inválido/);
  });

  it('rejects the wrong number of options', () => {
    expect(() =>
      parseQuizQuestions(quiz([question({ options: ['a', 'b', 'c'] }), question(), question()]), 17),
    ).toThrow(/Quiz inválido/);
  });

  it('rejects a verse beyond the chapter length', () => {
    expect(() =>
      parseQuizQuestions(quiz([question({ verse: 18 }), question(), question()]), 17),
    ).toThrow(/versículo 18/);
  });

  it('rejects repeated options (case-insensitive)', () => {
    expect(() =>
      parseQuizQuestions(
        quiz([question({ options: ['Társis', 'társis', 'Jope', 'Egito'] }), question(), question()]),
        17,
      ),
    ).toThrow(/repetidas/);
  });

  it('rejects non-object output', () => {
    expect(() => parseQuizQuestions('lorem', 17)).toThrow(/Quiz inválido/);
  });
});
