import { pronunciationFor } from '@/lib/speech';
import { shuffle } from '@/lib/study';
import type { Flashcard, Language, ListenQuestion } from '@/types';

export function buildListenQuestionForCard(
  card: Flashcard,
  pool: Flashcard[],
  language: Language,
): ListenQuestion | null {
  if (!card.mainText || !card.meaning) return null;
  const eligible = pool.filter((c) => c.mainText && c.meaning);
  const distractors = shuffle(
    eligible.filter((c) => c.id !== card.id && c.meaning !== card.meaning),
  ).slice(0, 3);
  if (distractors.length === 0) return null;

  const spokenText = pronunciationFor(card, language) || card.mainText;
  if (!spokenText) return null;

  const choicesWithCards = shuffle([
    { text: card.meaning, card },
    ...distractors.map((c) => ({ text: c.meaning, card: c })),
  ]);

  const choices = choicesWithCards.map((c) => c.text);
  const choiceCards = choicesWithCards.map((c) => c.card);
  const correctIndex = choicesWithCards.findIndex((c) => c.card.id === card.id);

  return { card, spokenText, choices, choiceCards, correctIndex };
}
