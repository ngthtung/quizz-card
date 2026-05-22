import { FIELD_KEYS, type FieldKey, type Flashcard } from '../types';

export function priority(card: Flashcard): number {
  const base = 1 + card.forgottenCount * 2 - card.rememberedCount;
  if (!card.lastReviewedAt) return Math.max(base, 3);
  return Math.max(base, 1);
}

export function pickWeighted(cards: Flashcard[]): Flashcard | null {
  if (cards.length === 0) return null;
  const weights = cards.map(priority);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < cards.length; i++) {
    r -= weights[i];
    if (r <= 0) return cards[i];
  }
  return cards[cards.length - 1];
}

export function nonEmptyFields(card: Flashcard): FieldKey[] {
  return FIELD_KEYS.filter((k) => Boolean(card[k]));
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
