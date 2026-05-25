import { pronunciationFor } from '../speech';
import {
  FIELD_KEYS,
  type FieldKey,
  type Flashcard,
  type Language,
  type ListenQuestion,
  type WriteQuestion,
} from '../../types';

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

const PROMPT_BIAS: FieldKey[] = ['meaning', 'variant1', 'mainText'];
const JA_ANSWER_BIAS: FieldKey[] = ['variant2', 'variant3', 'mainText'];

function pickFromBias(
  available: FieldKey[],
  bias: FieldKey[],
): FieldKey | null {
  const preferred = bias.filter((f) => available.includes(f));
  const pool = preferred.length > 0 ? preferred : available;
  return pool.length > 0 ? pickRandom(pool) : null;
}

export function buildWriteQuestion(
  cards: Flashcard[],
  options?: { isJapanese?: boolean },
): WriteQuestion | null {
  const isJapanese = options?.isJapanese ?? false;
  for (let attempt = 0; attempt < 10; attempt++) {
    const card = pickWeighted(cards);
    if (!card) return null;
    const fields = nonEmptyFields(card);
    if (fields.length < 2) continue;

    const promptField = pickFromBias(fields, PROMPT_BIAS);
    if (!promptField) continue;

    const answerCandidates = fields.filter((f) => f !== promptField);
    const answerBias = isJapanese ? JA_ANSWER_BIAS : [];
    const answerField = pickFromBias(answerCandidates, answerBias);
    if (!answerField) continue;

    return { card, promptField, answerField };
  }
  return null;
}

export function buildListenQuestion(
  cards: Flashcard[],
  options?: { language?: Pick<Language, 'name'> },
): ListenQuestion | null {
  const eligible = cards.filter((c) => c.mainText && c.meaning);
  if (eligible.length === 0) return null;

  const card = pickWeighted(eligible);
  if (!card) return null;

  const spokenText =
    pronunciationFor(card, options?.language) || card.mainText;
  if (!spokenText) return null;

  const distractorPool = eligible.filter(
    (c) => c.id !== card.id && c.meaning !== card.meaning,
  );
  const distractorCards = shuffle(distractorPool).slice(0, 3);
  if (distractorCards.length === 0) return null;

  const choicesWithCards = shuffle([
    { text: card.meaning, card },
    ...distractorCards.map((c) => ({ text: c.meaning, card: c })),
  ]);

  const choices = choicesWithCards.map((c) => c.text);
  const choiceCards = choicesWithCards.map((c) => c.card);
  const correctIndex = choicesWithCards.findIndex((c) => c.card.id === card.id);

  return { card, spokenText, choices, choiceCards, correctIndex };
}
