import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { matchesScope } from '@/lib/datasets';
import type { Scope } from '@/types';
import { SessionProgress } from '../SessionProgress';
import { buildQuestion } from '@/lib/study/mc/buildQuestion';
import { QuestionView } from './QuestionView';
import type { Question } from '@/lib/study/mc/types';

export function StandaloneMC({
  languageId,
  scope,
}: {
  languageId: string;
  scope: Scope;
}) {
  const language = useLiveQuery(
    () => db.languages.get(languageId),
    [languageId],
  );
  const cards = useLiveQuery(
    () =>
      db.flashcards
        .where('languageId')
        .equals(languageId)
        .filter((c) => matchesScope(c, scope))
        .toArray(),
    [languageId, scope],
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    if (cards && !question) {
      setQuestion(buildQuestion(cards));
    }
  }, [cards, question]);

  async function onPick(index: number) {
    if (!question || picked !== null) return;
    setPicked(index);
    const correct = index === question.correctIndex;
    await recordReview(question.card.id, correct);
  }

  async function onNext() {
    if (!cards) return;
    const fresh = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setQuestion(buildQuestion(fresh));
    setPicked(null);
  }

  if (!cards || !language) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">Loading…</p>
    );
  }
  if (cards.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">
        No cards in this language yet.
      </p>
    );
  }
  if (!question) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">
        Need at least two cards with a meaning and a kanji/hiragana/katakana
        field.
      </p>
    );
  }

  const sessionTotal = Math.max(cards.length, reviewed + 1);
  const progress = Math.min(100, (reviewed / sessionTotal) * 100);

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-6">
      <SessionProgress
        left={`Reviewed ${reviewed}`}
        right={`${cards.length} cards in pool`}
        value={progress}
      />

      <QuestionView
        question={question}
        language={language}
        picked={picked}
        onPick={onPick}
        onNext={onNext}
      />
    </div>
  );
}
