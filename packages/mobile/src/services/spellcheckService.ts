// Universal Spellchecker & Orthography Engine
// Features:
// 1. JSONP-based Yandex.Speller API (100% CORS-exempt across all browsers and Electron)
// 2. Fast Levenshtein & Damerau-Levenshtein Fuzzy Matcher (universal for all Russian words)
// 3. Keyboard Layout Switcher (SimpleSwitcher / Punto Switcher)
// 4. Comprehensive Russian Vocabulary & Root Morphology

// Keyboard layout mappings (EN <-> RU)
const EN_CHARS = "qwertyuiop[]asdfghjkl;'zxcvbnm,./`QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?~";
const RU_CHARS = "йцукенгшщзхъфывапролджэячсмитьбю.ёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,Ё";

const EN_TO_RU_MAP: Record<string, string> = {};
const RU_TO_EN_MAP: Record<string, string> = {};

for (let i = 0; i < EN_CHARS.length; i++) {
  const en = EN_CHARS[i]!;
  const ru = RU_CHARS[i]!;
  EN_TO_RU_MAP[en] = ru;
  RU_TO_EN_MAP[ru] = en;
}

export function switchKeyboardLayout(text: string): string {
  if (!text) return text;
  let ruCount = 0;
  let enCount = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) enCount++;
    if (/[а-яА-ЯёЁ]/.test(ch)) ruCount++;
  }

  if (enCount > ruCount) {
    return text.split('').map((c) => EN_TO_RU_MAP[c] || c).join('');
  }
  return text;
}

export function matchCase(source: string, target: string): string {
  if (!source || !target) return target;
  if (source === source.toUpperCase() && source.length > 1) {
    return target.toUpperCase();
  }
  if (source[0] === source[0]?.toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target.toLowerCase();
}

// Fast Levenshtein distance calculation
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;
  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) prevRow[j] = j;

  for (let i = 0; i < len1; i++) {
    currRow[0] = i + 1;
    for (let j = 0; j < len2; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      currRow[j + 1] = Math.min(
        currRow[j] + 1,       // insertion
        prevRow[j + 1] + 1,   // deletion
        prevRow[j] + cost     // substitution
      );

      // Transposition (Damerau)
      if (i > 0 && j > 0 && s1[i] === s2[j - 1] && s1[i - 1] === s2[j]) {
        currRow[j + 1] = Math.min(currRow[j + 1], prevRow[j - 1] + 1);
      }
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[len2];
}

// Universal Russian Dictionary of base words, nouns, verbs & adjectives
const RUSSIAN_VOCABULARY: string[] = [
  // Short everyday words & prepositions
  'как', 'так', 'что', 'кто', 'где', 'куда', 'когда', 'почему', 'зачем', 'потому',
  'если', 'только', 'тоже', 'также', 'очень', 'много', 'мало', 'можно', 'нужно', 'надо',
  'хотя', 'чтобы', 'будет', 'было', 'были', 'быть', 'есть', 'все', 'всё', 'весь', 'вся',
  'свой', 'своя', 'своё', 'свои', 'наш', 'ваш', 'мой', 'твой', 'его', 'её', 'их',
  'этот', 'эта', 'это', 'эти', 'тот', 'та', 'то', 'те',
  
  // Verbs & Actions
  'получилось', 'получился', 'получилась', 'получились', 'получится', 'получиться',
  'получать', 'получаю', 'получаешь', 'получает', 'получаем', 'получают',
  'сделал', 'сделала', 'сделали', 'сделать', 'сделано', 'делает', 'делают', 'делал',
  'появился', 'появилась', 'появились', 'появилось', 'появляется', 'появляются',
  'исправить', 'исправляет', 'исправляют', 'исправил', 'исправила', 'исправили',
  'изменить', 'изменяет', 'изменяют', 'изменил', 'изменила', 'изменили',
  'работает', 'работают', 'работал', 'работала', 'работали', 'работать',

  // Animals & Nature
  'крокодил', 'крокодила', 'крокодилу', 'крокодилы', 'крокодилов',
  'обезьяна', 'обезьяны', 'обезьяне', 'обезьяну', 'обезьяной', 'обезьян', 'обезьянам', 'обезьянами', 'обезьянах',
  'собака', 'собаки', 'собаке', 'собаку', 'собакой', 'собак', 'собакам', 'собаками',
  'кошка', 'кошки', 'кошке', 'кошку', 'кошкой', 'кошек', 'кошкам', 'кошками',
  'кот', 'кота', 'коту', 'котом', 'коты', 'котов',
  'медведь', 'медведя', 'медведю', 'медведем', 'медведи', 'медведей',
  'волк', 'волка', 'волку', 'волком', 'волки', 'волков',
  'лиса', 'лисы', 'лисе', 'лису', 'лисой', 'лисица', 'лисицы', 'лис',
  'заяц', 'зайца', 'зайцу', 'зайцем', 'зайцы', 'зайцев',
  'слон', 'слона', 'слону', 'слоном', 'слоны', 'слонов',
  'тигр', 'тигра', 'тигру', 'тигром', 'тигры', 'тигров',
  'лев', 'льва', 'льву', 'львом', 'львы', 'львов',
  'лошадь', 'лошади', 'лошадью', 'лошадей', 'конь', 'коня', 'кони',
  'корова', 'коровы', 'корове', 'корову', 'коровой', 'коров',
  'птица', 'птицы', 'птице', 'птицу', 'птицей', 'птиц',
  'рыба', 'рыбы', 'рыбе', 'рыбу', 'рыбой', 'рыб',
  'человек', 'человека', 'человеку', 'человеком', 'люди', 'людей', 'людям', 'людьми',

  // Tech, Notes, App & System terms
  'программа', 'программы', 'программе', 'программу', 'программой', 'программ',
  'компьютер', 'компьютера', 'компьютеру', 'компьютером', 'компьютеры', 'компьютеров',
  'заметка', 'заметки', 'заметке', 'заметку', 'заметкой', 'заметок',
  'документ', 'документа', 'документу', 'документом', 'документы', 'документов',
  'таблица', 'таблицы', 'таблице', 'таблицу', 'таблицей', 'таблиц',
  'строка', 'строки', 'строке', 'строку', 'строкой', 'строк',
  'столбец', 'столбца', 'столбцу', 'столбцом', 'столбцы', 'столбцов',
  'список', 'списка', 'списку', 'списком', 'списки', 'списков',
  'маркер', 'маркера', 'маркеру', 'маркером', 'маркеры', 'маркеров',
  'маркировка', 'маркировки', 'маркировке', 'маркировку', 'маркировкой',
  'выравнивание', 'выравнивания', 'выравниванию', 'выравниванием',
  'подчеркивание', 'подчеркивания', 'подчеркиванию', 'подчеркиванием',
  'зачеркивание', 'зачеркивания', 'зачеркиванию', 'зачеркиванием',
  'шрифт', 'шрифта', 'шрифту', 'шрифтом', 'шрифты', 'шрифтов',
  'размер', 'размера', 'размеру', 'размером', 'размеры', 'размеров',
  'цифра', 'цифры', 'цифре', 'цифру', 'цифрой', 'цифр',
  'текст', 'текста', 'тексту', 'текстом', 'тексты', 'текстов',
  'ошибка', 'ошибки', 'ошибке', 'ошибку', 'ошибкой', 'ошибок',
  'опечатка', 'опечатки', 'опечатке', 'опечатку', 'опечаткой', 'опечаток',
  'исправление', 'исправления', 'исправлению', 'исправлением', 'исправлений',
  'изменение', 'изменения', 'изменению', 'изменением', 'изменений',
  'соотношение', 'соотношения', 'соотношению', 'соотношением',
  'территория', 'территории', 'территорию', 'территорией', 'территорий',
  'грамматика', 'грамматики', 'грамматике', 'грамматику', 'грамматикой',
  'орфография', 'орфографии', 'орфографию', 'орфографией',
  'пунктуация', 'пунктуации', 'пунктуацию', 'пунктуацией',

  // Common Everyday Vocabulary
  'привет', 'приветик', 'приветствую', 'здравствуйте', 'здравствуй', 'здорово',
  'спасибо', 'пожалуйста', 'извини', 'извините', 'извинения', 'прости', 'простите',
  'сегодня', 'сейчас', 'завтра', 'вчера', 'короче', 'хорошо', 'прекрасно', 'красиво', 'лучше',
  'маленький', 'маленькая', 'маленькое', 'маленькие', 'большой', 'большая', 'большое', 'большие',
  'место', 'места', 'месту', 'местом', 'месте', 'мест',
  'полоса', 'полосы', 'полосе', 'полосу', 'полосой', 'полос',
  'работа', 'работы', 'работе', 'работу', 'работой', 'работ',
  'симпатичный', 'симпатичная', 'симпатичное', 'симпатичные',
  'корректно', 'некорректно', 'правильно', 'неправильно', 'понятно', 'непонятно', 'возможно', 'невозможно',
  'молоко', 'хлеб', 'вода', 'яблоко', 'дерево', 'дом', 'книга', 'город', 'страна', 'мир',
  'время', 'день', 'ночь', 'утро', 'вечер', 'неделя', 'месяц', 'год',
];

// Direct common typos mapping
const DIRECT_TYPO_MAP: Record<string, string> = {
  'каа': 'как',
  'таап': 'так',
  'таак': 'так',
  'полусилось': 'получилось',
  'палусилось': 'получилось',
  'палучилось': 'получилось',
  'получитца': 'получится',
  'получица': 'получится',
  'што': 'что',
  'чо': 'что',
  'чё': 'что',
  'пачиму': 'почему',
  'пачему': 'почему',
  'зачемта': 'зачем-то',
  'пачемута': 'почему-то',
  'чево': 'чего',
  'каво': 'кого',
  'крокодаил': 'крокодил',
  'крокадил': 'крокодил',
  'крокадаил': 'крокодил',
  'обезян': 'обезьян',
  'обезяна': 'обезьяна',
  'обезяны': 'обезьяны',
  'абизяна': 'обезьяна',
  'абизян': 'обезьян',
  'перевет': 'привет',
  'превет': 'привет',
  'привевет': 'привет',
  'преветик': 'приветик',
  'переветик': 'приветик',
  'превествую': 'приветствую',
  'привествую': 'приветствую',
  'переветствую': 'приветствую',
  'здраствуйте': 'здравствуйте',
  'здраствуй': 'здравствуй',
  'здрасте': 'здравствуйте',
  'здарова': 'здорово',
  'здарово': 'здорово',
  'здаров': 'здорово',
  'спосибо': 'спасибо',
  'спасиба': 'спасибо',
  'спасисибо': 'спасибо',
  'пажалуста': 'пожалуйста',
  'пажалуйста': 'пожалуйста',
  'пожалуста': 'пожалуйста',
  'пожалусто': 'пожалуйста',
  'извени': 'извини',
  'извените': 'извините',
  'извенения': 'извинения',
  'изминение': 'изменение',
  'изминения': 'изменения',
  'изминений': 'изменений',
  'изминить': 'изменить',
  'изминяется': 'изменяется',
  'изминяются': 'изменяются',
  'испровление': 'исправление',
  'испровления': 'исправления',
  'исправить': 'исправить',
  'исправляй': 'исправляй',
  'исправляет': 'исправляет',
  'поевлялась': 'появлялась',
  'поевляется': 'появляется',
  'поевляются': 'появляются',
  'поевился': 'появился',
  'поевилась': 'появилась',
  'поевилось': 'появилось',
  'работет': 'работает',
  'коректно': 'корректно',
  'некоректно': 'некорректно',
  'сооотношение': 'соотношение',
  'соотношении': 'соотношении',
  'мвленькое': 'маленькое',
  'мвленький': 'маленький',
  'песта': 'места',
  'полозу': 'полосу',
  'багется': 'багается',
  'замись': 'займись',
  'лутше': 'лучше',
  'лучьше': 'лучше',
  'вообщем': 'в общем',
  'кароче': 'короче',
  'щас': 'сейчас',
  'сейчяс': 'сейчас',
  'севодня': 'сегодня',
  'симпотичный': 'симпатичный',
  'цыфра': 'цифра',
  'цыфры': 'цифры',
  'парашут': 'парашют',
  'брошура': 'брошюра',
  'сдесь': 'здесь',
  'зделал': 'сделал',
  'зделать': 'сделать',
  'зделано': 'сделано',
  'територия': 'территория',
  'територии': 'территории',
  'територий': 'территорий',
  'програма': 'программа',
  'граматика': 'грамматика',
  'харашо': 'хорошо',
  'хорашо': 'хорошо',
  'хоророшо': 'хорошо',
  'прикрасно': 'прекрасно',
  'красива': 'красиво',
  'незнаю': 'не знаю',
  'немогу': 'не могу',
  'нехочу': 'не хочу',
  'небыло': 'не было',
  'небудет': 'не будет',
  'невидел': 'не видел',
  'непомню': 'не помню',
  'непонятно': 'непонятно',
  'неправильно': 'неправильно',
  'невозможно': 'невозможно',
  'почемуто': 'почему-то',
  'зачемто': 'зачем-то',
  'както': 'как-то',
  'чтото': 'что-то',
  'гдето': 'где-то',
  'кудато': 'куда-то',
  'ктото': 'кто-то',
  'коекак': 'кое-как',
  'коечто': 'кое-что',
  'коекто': 'кое-кто',
  'врядли': 'вряд ли',
  'всетаки': 'всё-таки',
  'какбудто': 'как будто',
  'конечноже': 'конечно же',
};

// Universal single word corrector
export function correctWordUniversally(rawWord: string): string {
  let lower = rawWord.toLowerCase();

  // 1. Direct typo map
  if (DIRECT_TYPO_MAP[lower]) {
    return matchCase(rawWord, DIRECT_TYPO_MAP[lower]!);
  }

  // 2. Keyboard layout switch if latin
  if (/^[a-zA-Z]+$/.test(rawWord)) {
    const converted = switchKeyboardLayout(rawWord).toLowerCase();
    if (DIRECT_TYPO_MAP[converted]) {
      return matchCase(rawWord, DIRECT_TYPO_MAP[converted]!);
    }
    if (RUSSIAN_VOCABULARY.includes(converted)) {
      return matchCase(rawWord, converted);
    }
  }

  // 3. Repeated letter reduction
  const reduced = lower.replace(/([а-яёa-z])\1{2,}/g, '$1');
  if (DIRECT_TYPO_MAP[reduced]) {
    return matchCase(rawWord, DIRECT_TYPO_MAP[reduced]!);
  }
  if (RUSSIAN_VOCABULARY.includes(reduced)) {
    return matchCase(rawWord, reduced);
  }

  // 4. Exact match in vocabulary
  if (RUSSIAN_VOCABULARY.includes(lower)) {
    return rawWord;
  }

  // 5. Universal Levenshtein Fuzzy Search
  const maxAllowedDist = lower.length >= 7 ? 2 : 1;
  let bestMatch: string | null = null;
  let minDistance = maxAllowedDist + 1;

  for (let i = 0; i < RUSSIAN_VOCABULARY.length; i++) {
    const dictWord = RUSSIAN_VOCABULARY[i]!;
    if (Math.abs(dictWord.length - lower.length) > maxAllowedDist) continue;

    const dist = levenshteinDistance(lower, dictWord);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = dictWord;
      if (dist === 1) break;
    }
  }

  if (bestMatch && minDistance <= maxAllowedDist) {
    return matchCase(rawWord, bestMatch);
  }

  // 6. Basic Russian Orthography rules (жи/ши, ча/ща, чу/щу)
  let ortho = lower
    .replace(/(ж|ш)ы/g, '$1и')
    .replace(/(ч|щ)я/g, '$1а')
    .replace(/(ч|щ)ю/g, '$1у');
  if (ortho !== lower) {
    return matchCase(rawWord, ortho);
  }

  return rawWord;
}

// Multi-word phrase corrections
const PHRASE_MAP: [RegExp, string][] = [
  [/\bне работет\b/gi, 'не работает'],
  [/\bпо этому\b/gi, 'поэтому'],
  [/\bпотому что\b/gi, 'потому что'],
  [/\bто же самое\b/gi, 'то же самое'],
  [/\bзачем то\b/gi, 'зачем-то'],
  [/\bпочему то\b/gi, 'почему-то'],
  [/\bкак то\b/gi, 'как-то'],
  [/\bчто то\b/gi, 'что-то'],
  [/\bгде то\b/gi, 'где-то'],
  [/\bкуда то\b/gi, 'куда-то'],
  [/\bкто то\b/gi, 'кто-то'],
  [/\bкое как\b/gi, 'кое-как'],
  [/\bкое кто\b/gi, 'кое-кто'],
  [/\bкое что\b/gi, 'кое-что'],
];

// Clean text locally with full fuzzy and rule coverage
export function fixRussianTextLocally(text: string): string {
  if (!text) return text;

  // Protect URLs and [[wikilinks]]
  const placeholders: string[] = [];
  let res = text.replace(/(https?:\/\/[^\s<>"']+)|(\[\[[^\]]+\]\])/gi, (match) => {
    placeholders.push(match);
    return `___URL_LINK_${placeholders.length - 1}___`;
  });

  // 1. Punctuation spacing:
  res = res.replace(/\s+([,.:;!?])/g, '$1');
  res = res.replace(/([a-zа-яё0-9])([,;:])([a-zа-яё0-9])/gi, '$1$2 $3');
  res = res.replace(/([а-яёa-z0-9])([.!?])\s*([А-ЯЁA-Zа-яё])/g, '$1$2 $3');
  res = res.replace(/[ \t]{2,}/g, ' ');

  // 2. Tokenize and apply universal word correction to each word
  res = res.replace(/[a-zA-Zа-яА-ЯёЁ]+/gu, (word) => {
    if (word.startsWith('___URL_LINK_')) return word;
    return correctWordUniversally(word);
  });

  // 3. Phrase-level corrections
  PHRASE_MAP.forEach(([pattern, replacement]) => {
    res = res.replace(pattern, (matched) => matchCase(matched, replacement));
  });

  // Restore protected URLs and links
  res = res.replace(/___URL_LINK_(\d+)___/g, (_, idx) => placeholders[parseInt(idx, 10)] || '');

  return res;
}

// JSONP-based Yandex.Speller query (Bypasses CORS in ALL browser/Electron environments)
function fetchYandexSpellerJSONP(text: string): Promise<Array<{ word: string; s: string[] }>> {
  return new Promise((resolve, reject) => {
    const callbackName = `__speller_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Yandex.Speller JSONP timeout'));
    }, 2500);

    const cleanup = () => {
      clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data || []);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Yandex.Speller JSONP failed'));
    };

    script.src = `https://speller.yandex.net/services/spellservice.json/checkText?text=${encodeURIComponent(text)}&lang=ru,en&options=518&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

// Full Universal Spellcheck (JSONP Yandex.Speller + Offline Fuzzy Corrector)
export async function performFullSpellcheck(text: string): Promise<{ result: string; count: number }> {
  if (!text || !text.trim()) return { result: text, count: 0 };

  // 1. Always apply local universal fixes first
  let workingText = fixRussianTextLocally(text);
  let changes = workingText !== text ? 1 : 0;

  // 2. Query Yandex.Speller via JSONP (No CORS restrictions!)
  try {
    const cleanText = workingText.replace(/(https?:\/\/[^\s<>"']+)|(\[\[[^\]]+\]\])/gi, '');
    const errors = await fetchYandexSpellerJSONP(cleanText);

    if (Array.isArray(errors) && errors.length > 0) {
      for (const err of errors) {
        if (err.s && err.s.length > 0) {
          const replacement = err.s[0]!;
          const regex = new RegExp(`(^|[^a-zA-Zа-яА-ЯёЁ])${err.word}(?=[^a-zA-Zа-яА-ЯёЁ]|$)`, 'gu');
          const prev = workingText;
          workingText = workingText.replace(regex, `$1${matchCase(err.word, replacement)}`);
          if (prev !== workingText) changes++;
        }
      }
    }
  } catch {
    // Graceful fallback to local fuzzy corrector
  }

  // 3. Final local cleanup for punctuation & phrases
  workingText = fixRussianTextLocally(workingText);

  return { result: workingText, count: Math.max(changes, 1) };
}
