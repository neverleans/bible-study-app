import {
  parseTahotLine,
  parseTagntLine,
  parseLexiconLine,
  createPositionAllocator,
  type ParsedWord,
} from './stepbible.parser';

const tab = (...cols: string[]) => cols.join('\t');

describe('stepbible parser', () => {
  describe('parseTahotLine', () => {
    it('parses a Hebrew word and picks the main Strong inside braces', () => {
      const line = tab(
        'Jon.1.1#02=L', 'דְּבַר\\־', 'de.var-', '[the] word of', '{H1697G}\\H9014',
        'HNcmsc', '', '', 'H1697G', '', '{H1697G=דָּבָר=: word»word:1_word;_speech;_command}\\H9014=־=link',
      );
      expect(parseTahotLine(line)).toMatchObject({
        bookOrder: 32,
        chapterNumber: 1,
        verseNumber: 1,
        position: 2,
        lang: 'heb',
        surface: 'דְּבַר־',
        transliteration: 'de.var-',
        gloss: '[the] word of',
        strong: 'H1697G',
        morph: 'HNcmsc',
        lemma: 'דָּבָר',
      });
    });

    it('strips prefix slashes and uses the braced word as main Strong', () => {
      const line = tab(
        'Jon.1.1#01=L', 'וַֽ/יְהִי֙', 'va/y.Hi', 'and/ it came', 'H9001/{H1961}', 'Hc/Vqw3ms',
        '', '', 'H1961', '', 'H9001=ו=&/{H1961=הָיָה=to be}',
      );
      const word = parseTahotLine(line)!;
      expect(word.surface).toBe('וַֽיְהִי֙');
      expect(word.gloss).toBe('and it came');
      expect(word.strong).toBe('H1961');
      expect(word.lemma).toBe('הָיָה');
    });

    it('accepts the English verse number when Hebrew versification is given in parentheses', () => {
      const line = tab('Jon.1.17(2.1)#01=L', 'וַ/יְמַ֤ן', 'va/y.Man', 'and/ he appointed', 'H9001/{H4487}', 'Hc/Vpw3ms');
      expect(parseTahotLine(line)).toMatchObject({ chapterNumber: 1, verseNumber: 17 });
    });

    it.each(['# Jon.1.1\tvay.Hi', '', 'Jon.1.1#02=Q(K)\tx', 'Zzz.1.1#01=L\tx'])(
      'ignores %j',
      (line) => expect(parseTahotLine(line)).toBeNull(),
    );
  });

  describe('parseTagntLine', () => {
    it('parses a Greek word from the NA28 base text', () => {
      const line = tab(
        'Mrk.1.1#01=NKO', 'Ἀρχὴ (Archē)', '[The] beginning', 'G0746=N-NSF', 'ἀρχή=beginning',
        'NA28+NA27',
      );
      expect(parseTagntLine(line)).toMatchObject({
        bookOrder: 41,
        chapterNumber: 1,
        verseNumber: 1,
        position: 1,
        lang: 'grc',
        surface: 'Ἀρχὴ',
        transliteration: 'Archē',
        gloss: '[The] beginning',
        strong: 'G0746',
        morph: 'N-NSF',
        lemma: 'ἀρχή',
      });
    });

    it('skips words that are only variants', () => {
      const line = tab('Mrk.1.1#07=ko', 'τοῦ (tou)', '<the>', 'G3588=T-GSM', 'ὁ=the/this/who');
      expect(parseTagntLine(line)).toBeNull();
    });
  });

  describe('parseLexiconLine', () => {
    it('parses an entry and strips HTML from the meaning', () => {
      const line = tab(
        'H0559', 'H0559 =', 'H0559', 'אָמַר', 'a.mar', 'H:V', 'to say',
        '1) to say, speak<br>1a) (Qal) to say<BR>Aramaic <i>a.mar</i>',
      );
      expect(parseLexiconLine(line)).toEqual({
        strong: 'H0559',
        lang: 'heb',
        lemma: 'אָמַר',
        transliteration: 'a.mar',
        morph: 'H:V',
        gloss: 'to say',
        meaning: '1) to say, speak\n1a) (Qal) to say\nAramaic a.mar',
      });
    });

    it('keys every row by its own dStrong, sense and relation rows included', () => {
      const main = tab('H1697', 'H1697G =', 'H1697G', 'דָּבָר', 'da.var', 'H:N-M', 'word', ': word');
      const sub = tab('H1697', 'H1697H = a Meaning of', 'H1697G', 'דָּבָר', 'da.var', 'H:N-M', 'word: x', ': x');
      expect(parseLexiconLine(main)?.strong).toBe('H1697G');
      expect(parseLexiconLine(sub)?.strong).toBe('H1697H');
      expect(parseLexiconLine(tab('H0430', 'H0430G = a Name of', 'H3068G', 'אֱלֹהִים', 'e.lo.him', 'H:N-M', 'God', ': God'))?.strong).toBe('H0430G');
    });

    it('marks Greek entries and ignores header lines', () => {
      expect(
        parseLexiconLine(tab('G3056', 'G3056 =', 'G3056', 'λόγος', 'logos', 'G:N-M', 'word', '<b>λόγος</b>')),
      ).toMatchObject({ lang: 'grc', lemma: 'λόγος' });
      expect(parseLexiconLine(tab('eStrong#', 'dStrong', 'uStrong'))).toBeNull();
    });
  });
});

describe('createPositionAllocator', () => {
  const word = (verseNumber: number, position: number) => ({ bookOrder: 4, chapterNumber: 26, verseNumber, position }) as ParsedWord;

  it('keeps positions as they are when a verse has no overlap', () => {
    const next = createPositionAllocator();
    expect([1, 2, 3].map((p) => next(word(1, p)))).toEqual([1, 2, 3]);
  });

  it('stores a second part of the same verse after the first instead of colliding', () => {
    const next = createPositionAllocator();
    const first = [1, 2, 3].map((p) => next(word(1, p)));
    const second = [1, 2].map((p) => next(word(1, p)));
    expect([...first, ...second]).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps gaps from skipped variant rows and does not mix verses', () => {
    const next = createPositionAllocator();
    expect([1, 3, 4].map((p) => next(word(1, p)))).toEqual([1, 3, 4]);
    expect(next(word(2, 1))).toBe(1);
  });
});
