// Half-width katakana (U+FF65–U+FF9F) → full-width katakana (U+30A1–U+30FA)
const HALF_TO_FULL_KATA: Record<string, string> = {
  'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ',
  'ｰ': 'ー',
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ﾝ': 'ン',
  'ﾞ': '゛', 'ﾟ': '゜',
};

const PLACEHOLDER_RE = /[～〜~]/g;
const LEADING_DASH_RE = /^[―\-－]+/;

function halfToFullKata(s: string): string {
  let out = '';
  for (const ch of s) out += HALF_TO_FULL_KATA[ch] ?? ch;
  return out;
}

function isLatin(s: string): boolean {
  // True if the string contains no CJK / kana characters.
  return !/[぀-ヿ一-鿿ｦ-ﾟ]/.test(s);
}

function normalizeOne(raw: string): string {
  let s = raw.normalize('NFC');
  s = halfToFullKata(s);
  s = s.replace(PLACEHOLDER_RE, '');
  s = s.replace(LEADING_DASH_RE, '');
  s = s.replace(/\s+/g, ' ').trim();
  if (isLatin(s)) s = s.toLowerCase();
  return s;
}

// Expand bracketed / slash-separated alternates to a list of accepted forms.
//
// Examples:
//   "だれ（どなた）"        → ["だれ", "だれ どなた", "どなた"]
//   "MT/ヨーネン/アキックス" → ["MT", "ヨーネン", "アキックス"]
//   "[~を]ください"          → ["ください", "~をください"]
function expandAlternates(input: string): string[] {
  const out = new Set<string>();

  // Slash- and comma-separated top-level alternates.
  const splitTop = input.split(/[／/,、]/g).map((s) => s.trim()).filter(Boolean);
  const seeds = splitTop.length > 1 ? splitTop : [input];

  for (const seed of seeds) {
    // Variant A: keep the bracketed content as-is (drop the brackets).
    const kept = seed.replace(/[［\[（(]/g, '').replace(/[］\]）)]/g, '');
    if (kept.trim()) out.add(kept);

    // Variant B: drop the bracketed content entirely.
    const dropped = seed.replace(/[［\[（(][^］\]）)]*[］\]）)]/g, '');
    if (dropped.trim()) out.add(dropped);

    // Variant C: just the bracketed content (so "だれ（どなた）" accepts "どなた").
    const inner = [...seed.matchAll(/[［\[（(]([^］\]）)]+)[］\]）)]/g)].map(
      (m) => m[1],
    );
    for (const piece of inner) {
      if (piece.trim()) out.add(piece);
    }
  }

  return [...out];
}

export function isAnswerCorrect(
  userInput: string,
  expected: string | string[],
): boolean {
  const got = normalizeOne(userInput);
  if (!got) return false;

  const sources = Array.isArray(expected) ? expected : [expected];
  const accepted = new Set<string>();
  for (const src of sources) {
    if (!src) continue;
    for (const variant of expandAlternates(src)) {
      const norm = normalizeOne(variant);
      if (norm) accepted.add(norm);
    }
  }
  return accepted.has(got);
}

// Exported for the dev demo / future tests.
export const _internal = { normalizeOne, expandAlternates, halfToFullKata };
