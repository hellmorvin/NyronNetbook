/**
 * Phonetic algorithms for Russian and English to enable typo-tolerant and phonetic search.
 */

// Russian phonetic mapping
const RU_PHONETIC_MAP: Record<string, string> = {
  'б': '1', 'п': '1',
  'в': '2', 'ф': '2',
  'г': '3', 'к': '3', 'х': '3',
  'д': '4', 'т': '4',
  'ж': '5', 'ш': '5', 'щ': '5', 'ч': '5', 'ц': '5',
  'з': '6', 'с': '6',
  'л': '7', 'р': '7',
  'м': '8', 'н': '8',
  'а': '0', 'о': '0', 'е': '0', 'ё': '0', 'э': '0', 'и': '0', 'ы': '0', 'у': '0', 'ю': '0', 'я': '0',
  'ъ': '', 'ь': '',
};

// English Soundex mapping
const EN_SOUNDEX_MAP: Record<string, string> = {
  'b': '1', 'f': '1', 'p': '1', 'v': '1',
  'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
  'd': '3', 't': '3',
  'l': '4',
  'm': '5', 'n': '5',
  'r': '6',
  'a': '0', 'e': '0', 'i': '0', 'o': '0', 'u': '0', 'y': '0', 'h': '0', 'w': '0',
};

export function russianSoundex(word: string): string {
  const clean = word.toLowerCase().replace(/[^а-яё]/g, '');
  if (!clean) return '';

  let code = clean[0] || '';
  let prevCode = RU_PHONETIC_MAP[code] || '';

  for (let i = 1; i < clean.length; i++) {
    const char = clean[i];
    if (!char) continue;
    const currCode = RU_PHONETIC_MAP[char] || '';
    if (currCode && currCode !== '0' && currCode !== prevCode) {
      code += currCode;
    }
    prevCode = currCode;
  }

  return code.padEnd(5, '0').slice(0, 5);
}

export function englishSoundex(word: string): string {
  let clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return '';

  // Phonetic normalization of starting consonants
  if (clean.startsWith('ph')) clean = 'f' + clean.slice(2);
  if (clean.startsWith('kn') || clean.startsWith('gn') || clean.startsWith('pn')) clean = 'n' + clean.slice(2);
  if (clean.startsWith('wr')) clean = 'r' + clean.slice(2);
  if (clean.startsWith('q')) clean = 'k' + clean.slice(1);
  if (clean.startsWith('c') && !['e', 'i', 'y'].includes(clean[1] || '')) clean = 'k' + clean.slice(1);

  const initialChar = clean[0]?.toUpperCase() || 'K';
  let code = initialChar;
  let prevCode = EN_SOUNDEX_MAP[clean[0] || ''] || '';

  for (let i = 1; i < clean.length; i++) {
    const char = clean[i];
    if (!char) continue;
    const currCode = EN_SOUNDEX_MAP[char] || '';
    if (currCode && currCode !== '0' && currCode !== prevCode) {
      code += currCode;
    }
    prevCode = currCode;
  }

  return code.padEnd(4, '0').slice(0, 4);
}

export function generatePhoneticKey(word: string): string {
  const isCyrillic = /[а-яё]/i.test(word);
  return isCyrillic ? russianSoundex(word) : englishSoundex(word);
}

export function generateTrigrams(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^\wа-яё]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  const trigrams = new Set<string>();

  for (const word of words) {
    if (word.length < 3) {
      trigrams.add(word);
      continue;
    }
    for (let i = 0; i <= word.length - 3; i++) {
      trigrams.add(word.slice(i, i + 3));
    }
  }

  return Array.from(trigrams);
}
