import { useState } from 'react';
import { buildWriteQuestion } from '@/lib/study';
import type { Flashcard, Language, WriteQuestion } from '@/types';
import { SkipFallback } from '../SkipFallback';
import { WriteForm } from './WriteForm';

export type ControlledWriteProps = {
  card: Flashcard;
  language: Language;
  onResult: (remembered: boolean) => void;
};

export function ControlledWrite({
  card,
  language,
  onResult,
}: ControlledWriteProps) {
  const isJapanese = language.name?.toLowerCase() === 'japanese';
  const [question] = useState<WriteQuestion | null>(() =>
    buildWriteQuestion([card], { isJapanese }),
  );

  if (!question) {
    return (
      <SkipFallback
        message="This card needs at least two filled fields to make a Write question. Skipping."
        onSkip={() => onResult(true)}
      />
    );
  }

  return (
    <WriteForm
      question={question}
      language={language}
      isJapanese={isJapanese}
      onNext={onResult}
    />
  );
}
