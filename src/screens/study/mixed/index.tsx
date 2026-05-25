import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { matchesScope } from '@/lib/datasets';
import type { Flashcard, Scope, SubMode } from '@/types';
import { SessionProgress } from '../SessionProgress';
import { MixedComplete } from './MixedComplete';
import { MixedTurn } from './MixedTurn';
import {
  applyResult,
  makeQueue,
  rollTurn,
  type Entry,
  type Turn,
} from '@/lib/study/mixed/mastery';

const SUB_MODE_LABELS: Record<SubMode, string> = {
  swipe: 'Swipe',
  mc: 'Multiple choice',
  write: 'Write',
  listen: 'Listen',
};

export function MixedMode({
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

  const cardsById = useMemo(() => {
    const m = new Map<string, Flashcard>();
    for (const c of cards ?? []) m.set(c.id, c);
    return m;
  }, [cards]);

  const [queue, setQueue] = useState<Entry[] | null>(null);
  const [mastered, setMastered] = useState(0);
  const [total, setTotal] = useState(0);
  const [answers, setAnswers] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);

  // Initialize queue once cards load.
  useEffect(() => {
    if (queue === null && cards && cards.length > 0) {
      const fresh = makeQueue(cards);
      setQueue(fresh);
      setTotal(fresh.length);
    }
  }, [cards, queue]);

  // Roll next turn whenever queue changes and there's no current turn.
  useEffect(() => {
    if (!queue || turn || queue.length === 0) return;
    const rolled = rollTurn(queue, cardsById);
    if (rolled) setTurn(rolled);
  }, [queue, turn, cardsById]);

  function onResult(remembered: boolean) {
    if (!turn || !queue) return;
    setAnswers((n) => n + 1);

    const updated = applyResult(turn.entry, remembered, turn.subMode);

    if (updated.mastered) {
      setMastered((n) => n + 1);
      setQueue(queue.filter((e) => e.cardId !== updated.cardId));
    } else {
      // Move to back so it doesn't immediately repeat.
      setQueue([
        ...queue.filter((e) => e.cardId !== updated.cardId),
        updated,
      ]);
    }
    setTurn(null);
  }

  function restart() {
    if (!cards) return;
    setQueue(makeQueue(cards));
    setTotal(cards.length);
    setMastered(0);
    setAnswers(0);
    setTurn(null);
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

  if (queue && queue.length === 0 && total > 0) {
    return (
      <MixedComplete total={total} answers={answers} onRestart={restart} />
    );
  }

  if (!turn) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-sm">Preparing…</p>
    );
  }

  const remaining = queue?.length ?? 0;
  const progress = total === 0 ? 0 : Math.round((mastered / total) * 100);

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-6">
      <SessionProgress
        left={
          <>
            <Badge variant="secondary" className="mr-2">
              Mixed
            </Badge>
            {SUB_MODE_LABELS[turn.subMode]}
          </>
        }
        right={`${mastered} / ${total} mastered · ${remaining} left`}
        value={progress}
      />

      <MixedTurn
        turn={turn}
        language={language}
        pool={cards}
        answers={answers}
        onResult={onResult}
      />
    </div>
  );
}
