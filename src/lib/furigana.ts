import kuromoji from 'kuromoji';

type KuromojiToken = {
  surface_form: string;
  reading?: string;
  pos: string;
};

type Tokenizer = {
  tokenize: (text: string) => KuromojiToken[];
};

let tokenizerInstance: Tokenizer | null = null;
let initPromise: Promise<Tokenizer> | null = null;

export async function getTokenizer(): Promise<Tokenizer> {
  if (tokenizerInstance) return tokenizerInstance;
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: '/dict/' })
      .build((err: Error | null, tokenizer: Tokenizer) => {
        if (err) {
          reject(err);
        } else {
          tokenizerInstance = tokenizer;
          resolve(tokenizer);
        }
      });
  });

  return initPromise;
}

function hasKanji(text: string): boolean {
  // Check if text contains kanji (CJK Unified Ideographs)
  return /[一-龯]/.test(text);
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

/**
 * Convert kanji text to format: KANJI(hiragana)
 * Example: "今日は" -> "今日(きょう)は"
 */
export async function addFurigana(text: string): Promise<string> {
  if (!text || !hasKanji(text)) return text;

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);

    let result = '';
    for (const token of tokens) {
      const word = token.surface_form;

      // If the word has kanji and a reading is available
      if (hasKanji(word) && token.reading) {
        const reading = katakanaToHiragana(token.reading);
        result += `${word}(${reading})`;
      } else {
        result += word;
      }
    }

    return result;
  } catch (error) {
    console.error('Furigana conversion error:', error);
    return text;
  }
}

/**
 * Synchronous version that returns original text if not ready
 * Use this for immediate display, then replace with async version
 */
export function addFuriganaSync(text: string): string {
  return text; // Fallback to original text
}
