import { useState } from 'react';
import type { Flashcard, Language, ListenQuestion } from '@/types';
import { SkipFallback } from '../SkipFallback';
import { buildListenQuestionForCard } from '@/lib/study/listen/buildQuestion';
import { ListenView } from './ListenView';

export type ControlledListenProps = {
  card: Flashcard;
  language: Language;
  pool: Flashcard[];
  onResult: (remembered: boolean) => void;
};

export function ControlledListen({
  card,
  language,
  pool,
  onResult,
}: ControlledListenProps) {
  const [question] = useState<ListenQuestion | null>(() =>
    buildListenQuestionForCard(card, pool, language),
  );

  if (!question) {
    return (
      <SkipFallback
        message="Can't build a Listen question for this card. Skipping."
        onSkip={() => onResult(true)}
      />
    );
  }

  return (
    <ListenView question={question} language={language} onResult={onResult} />
  );
}
