import { parseReflectionFeedback } from './reflections.schemas';

const valid = {
  coveredPoints: ['Deus chamou Jonas para ir a Nínive'],
  missingPoints: ['A tempestade no mar'],
  misunderstandings: [
    { claim: 'Jonas foi para Nínive de imediato', correction: 'Ele fugiu para Társis.', verse: 3 },
  ],
  encouragement: 'Você captou a ideia central, falta incluir a tempestade.',
};

describe('parseReflectionFeedback', () => {
  it('accepts well-formed feedback', () => {
    expect(parseReflectionFeedback(valid, 17)).toEqual(valid);
  });

  it('accepts feedback with no misunderstandings', () => {
    expect(parseReflectionFeedback({ ...valid, misunderstandings: [] }, 17).misunderstandings).toEqual([]);
  });

  it('rejects a correction that cites a verse outside the chapter', () => {
    const bad = { ...valid, misunderstandings: [{ ...valid.misunderstandings[0], verse: 40 }] };
    expect(() => parseReflectionFeedback(bad, 17)).toThrow(/versículo 40/);
  });

  it('rejects missing fields and wrong shapes', () => {
    expect(() => parseReflectionFeedback({ coveredPoints: [] }, 17)).toThrow(/Feedback inválido/);
    expect(() => parseReflectionFeedback('texto', 17)).toThrow(/Feedback inválido/);
  });

  it('rejects an empty encouragement', () => {
    expect(() => parseReflectionFeedback({ ...valid, encouragement: '' }, 17)).toThrow(/Feedback inválido/);
  });
});
