import { db } from './db';
import { newId, nowIso } from '../lib/id';
import type { Flashcard } from '../types';

export type CreateFlashcardInput = {
  languageId: string;
  mainText: string;
  variant1?: string;
  variant2?: string;
  variant3?: string;
  meaning?: string;
  notes?: string;
  tags?: string[];
};

export type UpdateFlashcardInput = Partial<
  Omit<
    Flashcard,
    'id' | 'createdAt' | 'updatedAt' | 'rememberedCount' | 'forgottenCount'
  >
>;

export async function listFlashcards(filters?: {
  languageId?: string;
  tag?: string;
}): Promise<Flashcard[]> {
  let cards: Flashcard[];
  if (filters?.languageId) {
    cards = await db.flashcards
      .where('languageId')
      .equals(filters.languageId)
      .toArray();
  } else {
    cards = await db.flashcards.toArray();
  }
  if (filters?.tag) {
    cards = cards.filter((c) => c.tags.includes(filters.tag!));
  }
  return cards.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFlashcard(
  id: string,
): Promise<Flashcard | undefined> {
  return db.flashcards.get(id);
}

export async function createFlashcard(
  input: CreateFlashcardInput,
): Promise<Flashcard> {
  const now = nowIso();
  const card: Flashcard = {
    id: newId(),
    languageId: input.languageId,
    mainText: input.mainText.trim(),
    variant1: (input.variant1 ?? '').trim(),
    variant2: (input.variant2 ?? '').trim(),
    variant3: (input.variant3 ?? '').trim(),
    meaning: (input.meaning ?? '').trim(),
    notes: input.notes?.trim() || undefined,
    tags: input.tags ?? [],
    rememberedCount: 0,
    forgottenCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.flashcards.add(card);
  return card;
}

export async function updateFlashcard(
  id: string,
  patch: UpdateFlashcardInput,
): Promise<void> {
  await db.flashcards.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteFlashcard(id: string): Promise<void> {
  await db.flashcards.delete(id);
}

export async function recordReview(
  id: string,
  remembered: boolean,
): Promise<void> {
  const card = await db.flashcards.get(id);
  if (!card) return;
  await db.flashcards.update(id, {
    rememberedCount: card.rememberedCount + (remembered ? 1 : 0),
    forgottenCount: card.forgottenCount + (remembered ? 0 : 1),
    lastReviewedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function listAllTags(languageId?: string): Promise<string[]> {
  const cards = await listFlashcards({ languageId });
  const set = new Set<string>();
  for (const c of cards) {
    for (const t of c.tags) set.add(t);
  }
  return [...set].sort();
}
