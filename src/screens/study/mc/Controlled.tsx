import { useState } from 'react';
import { recordReview } from '@/db/flashcards';
import type { Flashcard, Language } from '@/types';
import { SkipFallback } from '../SkipFallback';
import { buildQuestionForCard } from '@/lib/study/mc/buildQuestion';
import { QuestionView } from './QuestionView';
import type { Question } from '@/lib/study/mc/types';

export type ControlledMCProps = {
  card: Flashcard;
  language: Language;
  pool: Flashcard[];
  onResult: (remembered: boolean) => void;
};

export function ControlledMC({
  card,
  language,
  pool,
  onResult,
}: ControlledMCProps) {
  const [question] = useState<Question | null>(() =>
    buildQuestionForCard(card, pool),
  );
  const [picked, setPicked] = useState<number | null>(null);

  if (!question) {
    return (
      <SkipFallback
        message="Can't build a multiple-choice question for this card. Skipping."
        onSkip={() => onResult(true)}
      />
    );
  }

  async function onPick(index: number) {
    if (picked !== null || !question) return;
    setPicked(index);
    const correct = index === question.correctIndex;
    await recordReview(question.card.id, correct);
  }

  return (
    <QuestionView
      question={question}
      language={language}
      picked={picked}
      onPick={onPick}
      onNext={() => onResult(picked === question.correctIndex)}
    />
  );
}
