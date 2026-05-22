const KANA_MAP: Record<string, string> = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',

  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',

  sa: 'さ', shi: 'し', su: 'す', se: 'せ', so: 'そ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ',
  si: 'し', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  za: 'ざ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ',
  zi: 'じ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
  jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',

  ta: 'た', chi: 'ち', tsu: 'つ', te: 'て', to: 'と',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
  ti: 'ち', tu: 'つ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',

  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',

  ha: 'は', hi: 'ひ', fu: 'ふ', he: 'へ', ho: 'ほ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  hu: 'ふ',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',

  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',

  ya: 'や', yu: 'ゆ', yo: 'よ',

  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',

  wa: 'わ', wo: 'を',
};

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);
const SOKUON = new Set([
  'k','s','t','p','g','d','b','c','f','h','m','r','w','z','j','y',
]);

const LONG_VOWEL_MAP: Record<string, string> = {
  ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'ou',
  â: 'aa', î: 'ii', û: 'uu', ê: 'ee', ô: 'ou',
};

export function romajiToHiragana(input: string): string {
  if (!input) return '';
  let s = input.toLowerCase();
  s = s.replace(/[āīūēōâîûêô]/g, (m) => LONG_VOWEL_MAP[m] ?? m);
  s = s.replace(/['’]/g, '');

  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!/[a-z]/.test(c)) {
      out += c;
      i++;
      continue;
    }
    if (c === 'n') {
      const nxt = s[i + 1];
      if (!nxt || (!VOWELS.has(nxt) && nxt !== 'y')) {
        out += 'ん';
        i++;
        continue;
      }
    }
    if (c === 't' && s[i + 1] === 'c' && s[i + 2] === 'h') {
      out += 'っ';
      i++;
      continue;
    }
    if (c !== 'n' && SOKUON.has(c) && s[i + 1] === c) {
      out += 'っ';
      i++;
      continue;
    }
    let matched = false;
    for (const len of [3, 2, 1] as const) {
      const slice = s.slice(i, i + len);
      if (slice.length === len && KANA_MAP[slice]) {
        out += KANA_MAP[slice];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += c;
      i++;
    }
  }
  return out;
}

const ROMAJI_RE = /[a-zāīūēōâîûêô]/i;

export function looksLikeRomaji(text: string): boolean {
  if (!text) return false;
  return ROMAJI_RE.test(text);
}
