import { db } from '@/db/db';

/**
 * Delete flashcards that are kana alphabet characters (hiragana/katakana)
 * Returns the number of cards deleted
 */
export async function deleteKanaAlphabetCards(): Promise<number> {
  const allCards = await db.flashcards.toArray();

  // Filter for single kana characters (alphabet learning cards)
  const kanaCards = allCards.filter((card) => {
    const text = card.mainText || '';
    // Match single hiragana or katakana characters, or very short pure kana
    return /^[ぁ-んァ-ン]{1,2}$/.test(text);
  });

  // Delete the cards
  if (kanaCards.length > 0) {
    await db.flashcards.bulkDelete(kanaCards.map((c) => c.id));
  }

  return kanaCards.length;
}
