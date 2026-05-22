import { romajiToHiragana } from './kana';
import type { Flashcard } from '@/types';

/**
 * Format kanji with hiragana reading in parentheses
 * Example: formatWithReading("辞書", "jisho") -> "辞書(じしょ)"
 */
export function formatWithReading(
  kanji: string,
  reading: string | undefined,
): string {
  if (!kanji) return '';
  if (!reading) return kanji;

  // Check if kanji actually contains kanji characters
  const hasKanji = /[一-龯]/.test(kanji);
  if (!hasKanji) return kanji;

  // Convert romaji to hiragana if needed
  const hiragana = /[ぁ-ん]/.test(reading)
    ? reading
    : romajiToHiragana(reading);

  return `${kanji}(${hiragana})`;
}

/**
 * Get formatted text for a flashcard field with reading
 */
export function getFormattedText(card: Flashcard, field: 'mainText'): string {
  const text = card[field];
  if (!text) return '';

  // Try variant2 (hiragana) first, then variant1 (romaji)
  const reading = card.variant2 || card.variant1;
  return formatWithReading(text, reading);
}

// Legacy exports for compatibility
export async function addFurigana(text: string): Promise<string> {
  return text;
}

export function addFuriganaSync(text: string): string {
  return text;
}
