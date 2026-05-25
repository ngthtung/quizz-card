import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { matchesScope } from '@/lib/datasets';
import { buildWriteQuestion } from '@/lib/study';
import type { Scope, WriteQuestion } from '@/types';
import { SessionProgress } from '../SessionProgress';
import { WriteForm } from './WriteForm';

export function StandaloneWrite({
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

  const isJapanese = language?.name?.toLowerCase() === 'japanese';

  const [question, setQuestion] = useState<WriteQuestion | null>(null);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    if (cards && !question) {
      setQuestion(buildWriteQuestion(cards, { isJapanese }));
    }
  }, [cards, question, isJapanese]);

  async function next() {
    if (!cards) return;
    const fresh = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setQuestion(buildWriteQuestion(fresh, { isJapanese }));
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
        Need at least one card with two filled fields.
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

      <WriteForm
        key={question.card.id + question.promptField + question.answerField}
        question={question}
        language={language}
        isJapanese={isJapanese}
        onNext={() => void next()}
      />
    </div>
  );
}
