import type { Flashcard, Language } from '@/types';
import { SwipeMode } from '../swipe';
import { MultipleChoiceMode } from '../mc';
import { ListenMode } from '../listen';
import type { Turn } from '@/lib/study/mixed/mastery';

export function MixedTurn({
  turn,
  language,
  pool,
  answers,
  onResult,
}: {
  turn: Turn;
  language: Language;
  pool: Flashcard[];
  // `answers` is part of the React key so each new turn gets a fresh
  // controlled instance even if the same card is re-rolled in the same mode.
  answers: number;
  onResult: (remembered: boolean) => void;
}) {
  if (turn.subMode === 'swipe') {
    return (
      <SwipeMode
        key={`swipe-${turn.card.id}-${answers}`}
        controlled={{ card: turn.card, language, onResult }}
      />
    );
  }
  if (turn.subMode === 'mc') {
    return (
      <MultipleChoiceMode
        key={`mc-${turn.card.id}-${answers}`}
        controlled={{ card: turn.card, language, pool, onResult }}
      />
    );
  }
  if (turn.subMode === 'listen') {
    return (
      <ListenMode
        key={`listen-${turn.card.id}-${answers}`}
        controlled={{ card: turn.card, language, pool, onResult }}
      />
    );
  }
  return null;
}
