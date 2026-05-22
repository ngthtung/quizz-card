import { formatWithReading } from '@/lib/furigana';
import type { Flashcard } from '@/types';

/**
 * Furigana component - displays kanji with hiragana readings
 * Example: card.mainText="辞書" + card.variant1="jisho" -> "辞書(じしょ)"
 */
export function Furigana({
  text,
  card,
  enabled = true,
}: {
  text: string;
  card?: Flashcard;
  enabled?: boolean;
}) {
  if (!enabled || !text) return <>{text}</>;

  // If we have card data and text matches mainText, format with reading
  if (card && text === card.mainText) {
    const reading = card.variant2 || card.variant1;
    const formatted = formatWithReading(text, reading);
    return <>{formatted}</>;
  }

  // Otherwise just return the text as-is
  return <>{text}</>;
}
