import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { matchesScope } from '@/lib/datasets';
import { nonEmptyFields, pickRandom, pickWeighted } from '@/lib/study';
import type { FieldKey, Flashcard, Scope } from '@/types';
import { SessionProgress } from '../SessionProgress';
import { SwipeCard } from './SwipeCard';
import { SwipeControls } from './SwipeControls';

export function StandaloneSwipe({
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

  const [current, setCurrent] = useState<{
    card: Flashcard;
    promptField: FieldKey;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    if (cards && !current) {
      const next = nextCard(cards);
      if (next) setCurrent(next);
    }
  }, [cards, current]);

  function nextCard(pool: Flashcard[]) {
    const card = pickWeighted(pool);
    if (!card) return null;
    const fields = nonEmptyFields(card);
    if (fields.length === 0) return null;
    return { card, promptField: pickRandom(fields) };
  }

  async function submit(remembered: boolean) {
    if (!current || !cards) return;
    await recordReview(current.card.id, remembered);
    const updated = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setCurrent(nextCard(updated));
    setRevealed(false);
  }

  if (!cards || !language) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">Loading…</p>
    );
  }
  if (cards.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">
        No cards in this language yet. Add some on the Cards screen.
      </p>
    );
  }
  if (!current) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">Preparing…</p>
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

      <SwipeCard
        key={current.card.id + current.promptField}
        card={current.card}
        language={language}
        promptField={current.promptField}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onSubmit={submit}
      />

      <SwipeControls
        revealed={revealed}
        onToggleReveal={() => setRevealed((v) => !v)}
        onSubmit={submit}
      />
    </div>
  );
}
