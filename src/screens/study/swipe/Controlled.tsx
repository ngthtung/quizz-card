import { useState } from 'react';
import { recordReview } from '@/db/flashcards';
import { nonEmptyFields, pickRandom } from '@/lib/study';
import type { FieldKey, Flashcard, Language } from '@/types';
import { SwipeCard } from './SwipeCard';
import { SwipeControls } from './SwipeControls';

export type ControlledSwipeProps = {
  card: Flashcard;
  language: Language;
  onResult: (remembered: boolean) => void;
};

export function ControlledSwipe({
  card,
  language,
  onResult,
}: ControlledSwipeProps) {
  const [revealed, setRevealed] = useState(false);
  const [promptField] = useState<FieldKey>(() => {
    const fields = nonEmptyFields(card);
    return fields.length > 0 ? pickRandom(fields) : 'mainText';
  });

  async function submit(remembered: boolean) {
    await recordReview(card.id, remembered);
    onResult(remembered);
  }

  return (
    <>
      <SwipeCard
        key={card.id + promptField}
        card={card}
        language={language}
        promptField={promptField}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onSubmit={submit}
      />
      <SwipeControls
        revealed={revealed}
        onToggleReveal={() => setRevealed((v) => !v)}
        onSubmit={submit}
      />
    </>
  );
}
