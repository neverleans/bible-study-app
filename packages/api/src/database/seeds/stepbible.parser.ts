/**
 * Pure parsers for STEPBible-Data files (Tyndale House / STEPBible.org, CC BY 4.0):
 * TAHOT (Hebrew OT), TAGNT (Greek NT) and the TBESH/TBESG brief lexicons.
 * Source: https://github.com/STEPBible/STEPBible-Data
 */

/** STEPBible book codes in canonical order; index + 1 equals `books.order`. */
export const STEP_BOOK_CODES = [
  'Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki',
  '1Ch', '2Ch', 'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'Sng', 'Isa', 'Jer',
  'Lam', 'Ezk', 'Dan', 'Hos', 'Jol', 'Amo', 'Oba', 'Jon', 'Mic', 'Nam', 'Hab', 'Zep',
  'Hag', 'Zec', 'Mal', 'Mat', 'Mrk', 'Luk', 'Jhn', 'Act', 'Rom', '1Co', '2Co', 'Gal',
  'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit', 'Phm', 'Heb', 'Jas', '1Pe',
  '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev',
] as const;

export interface ParsedWord {
  bookOrder: number;
  chapterNumber: number;
  verseNumber: number;
  position: number;
  lang: 'heb' | 'grc';
  surface: string;
  transliteration: string | null;
  gloss: string | null;
  strong: string | null;
  morph: string | null;
  lemma: string | null;
}

export interface ParsedLexiconEntry {
  strong: string;
  lang: 'heb' | 'grc';
  lemma: string;
  transliteration: string | null;
  morph: string | null;
  gloss: string | null;
  meaning: string | null;
}

// "Jon.1.17(2.1)#01=L": optional parenthesised Hebrew versification before '#'.
const WORD_REF = /^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)(?:\([^)]*\))?#(\d+)=(.+)$/;

function bookOrder(code: string): number | null {
  const idx = STEP_BOOK_CODES.indexOf(code as (typeof STEP_BOOK_CODES)[number]);
  return idx === -1 ? null : idx + 1;
}

function clean(value: string | undefined): string | null {
  const v = (value ?? '').replace(/\s+/g, ' ').trim();
  return v === '' ? null : v;
}

/** One TAHOT word line, or null for comments, headers and non-base-text variants. */
export function parseTahotLine(line: string): ParsedWord | null {
  const cols = line.split('\t');
  const ref = WORD_REF.exec(cols[0] ?? '');
  if (!ref) return null;
  const [, code, chapter, verse, pos, type] = ref;
  // Only the Leningrad base reading; Qere/Ketiv and manuscript variants are skipped.
  if (type !== 'L') return null;
  const order = bookOrder(code);
  if (order === null) return null;

  const surface = clean((cols[1] ?? '').replace(/[/\\]/g, ''));
  if (!surface) return null;

  // dStrongs look like "H9001/{H1961}" where the braces mark the main word.
  const mainStrong = /\{([HG]\d+[A-Za-z]?)\}/.exec(cols[4] ?? '')?.[1] ?? null;
  // The expanded "{H1697G=lemma=gloss}" column sits after a few empty columns; search them all.
  const expanded = cols.slice(9).join(' ');
  const lemma = mainStrong
    ? new RegExp(`\\{${mainStrong}=([^=}]+)=`).exec(expanded)?.[1] ?? null
    : null;

  return {
    bookOrder: order,
    chapterNumber: Number(chapter),
    verseNumber: Number(verse),
    position: Number(pos),
    lang: 'heb',
    surface,
    transliteration: clean((cols[2] ?? '').replace(/\//g, '')),
    gloss: clean((cols[3] ?? '').replace(/\//g, '')),
    strong: mainStrong,
    morph: clean(cols[5]),
    lemma: clean(lemma ?? undefined),
  };
}

/** One TAGNT word line, or null. Keeps only words in the NA28 base text (type starts with N). */
export function parseTagntLine(line: string): ParsedWord | null {
  const cols = line.split('\t');
  const ref = WORD_REF.exec(cols[0] ?? '');
  if (!ref) return null;
  const [, code, chapter, verse, pos, type] = ref;
  if (!type.startsWith('N')) return null;
  const order = bookOrder(code);
  if (order === null) return null;

  const greek = /^(.*?)\s*\((.*)\)\s*$/.exec(cols[1] ?? '');
  const surface = clean(greek ? greek[1] : cols[1]);
  if (!surface) return null;

  // "G0746=N-NSF" -> strong + morphology; "ἀρχή=beginning" -> lemma = gloss.
  const [strong, morph] = (cols[3] ?? '').split('=');
  const lemma = (cols[4] ?? '').split('=')[0];

  return {
    bookOrder: order,
    chapterNumber: Number(chapter),
    verseNumber: Number(verse),
    position: Number(pos),
    lang: 'grc',
    surface,
    transliteration: clean(greek?.[2]),
    gloss: clean(cols[2]?.replace(/[<>]/g, '')),
    strong: clean(strong),
    morph: clean(morph),
    lemma: clean(lemma),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

const MAX_MEANING = 2000;

/** One TBESH/TBESG lexicon line (eStrong, dStrong, uStrong, lemma, translit, morph, gloss, meaning). */
export function parseLexiconLine(line: string): ParsedLexiconEntry | null {
  const cols = line.split('\t');
  // The key is the disambiguated Strong in column 2 ("H1697G ="), which is what the word files
  // use. Sense rows ("H6213A = a Meaning of H6213H") and relation rows ("H0430G = a Name of ...")
  // are real keys too: the word files point at them, so they must be kept.
  const strong = /^([HG]\d{4}[A-Za-z]?)\s*=/.exec((cols[1] ?? '').trim())?.[1];
  if (!strong) return null;
  const lemma = clean(cols[3]);
  if (!lemma) return null;
  const meaning = stripHtml(cols[7] ?? '');

  return {
    strong,
    lang: strong.startsWith('H') ? 'heb' : 'grc',
    lemma,
    transliteration: clean(cols[4]),
    morph: clean(cols[5]),
    gloss: clean(cols[6]),
    meaning: meaning === '' ? null : meaning.slice(0, MAX_MEANING),
  };
}

/**
 * Where Hebrew and English versification overlap, STEPBible lists the words of one English verse
 * under two references (e.g. "Num.26.1(25.19)" then "Num.26.1"), and each part restarts its word
 * numbers at 1. Keep the file order and make positions strictly increasing within a verse, so the
 * two parts are stored one after the other instead of colliding.
 */
export function createPositionAllocator(): (w: ParsedWord) => number {
  const last = new Map<string, number>();
  return (w) => {
    const key = `${w.bookOrder}:${w.chapterNumber}:${w.verseNumber}`;
    const position = Math.max(w.position, (last.get(key) ?? 0) + 1);
    last.set(key, position);
    return position;
  };
}
