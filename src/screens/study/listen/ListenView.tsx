import { useEffect, useRef, useState } from 'react';
import { recordReview } from '@/db/flashcards';
import { cleanForSpeech, speak } from '@/lib/speech';
import type { Language, ListenQuestion } from '@/types';
import { PlayPrompt } from './PlayPrompt';
import { MeaningChoices } from './MeaningChoices';
import { ListenReveal } from './ListenReveal';

export function ListenView({
  question,
  language,
  onResult,
}: {
  question: ListenQuestion;
  language: Language;
  onResult: (remembered: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const text = cleanForSpeech(question.spokenText);
    if (text) speak(text, language.name);
  }, [question, language]);

  useEffect(() => {
    if (picked !== null) nextRef.current?.focus();
  }, [picked]);

  function replay() {
    const text = cleanForSpeech(question.spokenText);
    if (text) speak(text, language.name);
  }

  async function onPick(index: number) {
    if (picked !== null) return;
    setPicked(index);
    const correct = index === question.correctIndex;
    await recordReview(question.card.id, correct);
  }

  return (
    <>
      <PlayPrompt onReplay={replay} />
      <MeaningChoices question={question} picked={picked} onPick={onPick} />
      {picked !== null ? (
        <ListenReveal
          ref={nextRef}
          question={question}
          language={language}
          onReplay={replay}
          onNext={() => onResult(picked === question.correctIndex)}
        />
      ) : null}
    </>
  );
}
