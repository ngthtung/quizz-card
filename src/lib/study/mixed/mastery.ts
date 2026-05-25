import { pickRandom, pickWeighted } from '@/lib/study';
import { speechSupported } from '@/lib/speech';
import type { Flashcard, SubMode } from '@/types';

// Streak required to master a card in MC / Listen.
// Swipe is one-shot: a single right-swipe masters the card, matching the
// existing "swipe right = remembered" convention.
// Write is excluded from Mixed — mixing typing with tap/swipe disrupts
// rhythm too much; use the standalone Write mode for production drills.
export const MASTERY_STREAK = 3;

export type Entry = {
  cardId: string;
  streak: number;
  mastered: boolean;
};

export type Turn = {
  card: Flashcard;
  entry: Entry;
  subMode: SubMode;
};

export function makeQueue(cards: Flashcard[]): Entry[] {
  return cards.map((c) => ({ cardId: c.id, streak: 0, mastered: false }));
}

export function applyResult(
  entry: Entry,
  remembered: boolean,
  subMode: SubMode,
): Entry {
  if (!remembered) {
    return { ...entry, streak: 0 };
  }
  if (subMode === 'swipe') {
    return { ...entry, mastered: true };
  }
  const streak = entry.streak + 1;
  return { ...entry, streak, mastered: streak >= MASTERY_STREAK };
}

export function rollTurn(
  queue: Entry[],
  cardsById: Map<string, Flashcard>,
): Turn | null {
  if (queue.length === 0) return null;

  const live = queue
    .map((e) => ({ entry: e, card: cardsById.get(e.cardId) }))
    .filter((x): x is { entry: Entry; card: Flashcard } => Boolean(x.card));
  if (live.length === 0) return null;

  const card = pickWeighted(live.map((x) => x.card)) ?? live[0].card;
  const entry = live.find((x) => x.card.id === card.id)!.entry;

  const allowed: SubMode[] = speechSupported
    ? ['swipe', 'mc', 'listen']
    : ['swipe', 'mc'];

  // Listen needs both mainText and meaning. Drop it if the card lacks either.
  const subModes = allowed.filter(
    (m) => m !== 'listen' || (card.mainText && card.meaning),
  );
  const subMode = pickRandom(subModes);

  return { card, entry, subMode };
}
