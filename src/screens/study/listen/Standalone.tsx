import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { matchesScope } from '@/lib/datasets';
import { speechSupported } from '@/lib/speech';
import { buildListenQuestion } from '@/lib/study';
import type { ListenQuestion, Scope } from '@/types';
import { SessionProgress } from '../SessionProgress';
import { ListenView } from './ListenView';

export function StandaloneListen({
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

  const [question, setQuestion] = useState<ListenQuestion | null>(null);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    if (cards && language && !question) {
      setQuestion(buildListenQuestion(cards, { language }));
    }
  }, [cards, language, question]);

  async function next() {
    if (!cards || !language) return;
    const fresh = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setQuestion(buildListenQuestion(fresh, { language }));
  }

  if (!speechSupported) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">
        Listening mode needs browser TTS, which isn't available here.
      </p>
    );
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
        Need at least two cards with audio and meaning.
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

      <ListenView
        key={question.card.id}
        question={question}
        language={language}
        onResult={() => void next()}
      />
    </div>
  );
}
