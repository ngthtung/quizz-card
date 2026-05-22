import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { db } from '../../db/db';
import { recordReview } from '../../db/flashcards';
import { Button } from '../../components/Button';
import {
  nonEmptyFields,
  pickRandom,
  pickWeighted,
} from '../../lib/study';
import type { FieldKey, Flashcard, Language } from '../../types';

const SWIPE_THRESHOLD = 110;

export function SwipeMode({ languageId }: { languageId: string }) {
  const language = useLiveQuery(
    () => db.languages.get(languageId),
    [languageId],
  );
  const cards = useLiveQuery(
    () => db.flashcards.where('languageId').equals(languageId).toArray(),
    [languageId],
  );

  const [current, setCurrent] = useState<{
    card: Flashcard;
    promptField: FieldKey;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);

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
      .toArray();
    setCurrent(nextCard(updated));
    setRevealed(false);
  }

  if (!cards || !language) {
    return <div className="px-4 py-6 text-slate-600">Loading…</div>;
  }
  if (cards.length === 0) {
    return (
      <div className="px-4 py-6 text-slate-600">
        No cards in this language yet. Add some on the Cards screen.
      </div>
    );
  }
  if (!current) {
    return <div className="px-4 py-6 text-slate-600">Preparing…</div>;
  }

  return (
    <div className="px-4 py-6 md:px-6">
      <SwipeCard
        key={current.card.id + current.promptField}
        card={current.card}
        language={language}
        promptField={current.promptField}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onSubmit={submit}
      />

      <div className="mx-auto mt-6 flex max-w-md gap-3">
        <Button
          variant="danger"
          className="flex-1 py-3 text-base"
          onClick={() => submit(false)}
        >
          Forgot
        </Button>
        <Button
          variant="secondary"
          className="flex-1 py-3 text-base"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? 'Hide' : 'Reveal'}
        </Button>
        <Button
          className="flex-1 bg-emerald-600 py-3 text-base hover:bg-emerald-700"
          onClick={() => submit(true)}
        >
          Remember
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({
  card,
  language,
  promptField,
  revealed,
  onReveal,
  onSubmit,
}: {
  card: Flashcard;
  language: Language;
  promptField: FieldKey;
  revealed: boolean;
  onReveal: () => void;
  onSubmit: (remembered: boolean) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const overlayLeft = useTransform(x, [-160, -40], [1, 0]);
  const overlayRight = useTransform(x, [40, 160], [0, 1]);

  const otherFields = useMemo(
    () => nonEmptyFields(card).filter((f) => f !== promptField),
    [card, promptField],
  );

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (down) {
        x.set(mx);
        return;
      }
      const flick = Math.abs(vx) > 0.4;
      if (mx > SWIPE_THRESHOLD || (flick && dx > 0)) {
        x.set(500);
        onSubmit(true);
      } else if (mx < -SWIPE_THRESHOLD || (flick && dx < 0)) {
        x.set(-500);
        onSubmit(false);
      } else {
        x.set(0);
      }
    },
    { axis: 'x', filterTaps: true },
  );

  return (
    <div className="relative mx-auto h-80 max-w-md select-none">
      <div
        {...bind()}
        className="absolute inset-0"
        style={{ touchAction: 'pan-y' }}
      >
      <motion.div
        style={{ x, rotate }}
        className="absolute inset-0 cursor-grab rounded-2xl border border-slate-200 bg-white p-6 shadow-lg active:cursor-grabbing"
        onClick={() => !revealed && onReveal()}
      >
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {language.fieldLabels[promptField]}
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900 break-words">
          {card[promptField]}
        </p>

        {revealed ? (
          <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            {otherFields.map((f) => (
              <div key={f} className="flex justify-between gap-3">
                <dt className="text-xs text-slate-400">
                  {language.fieldLabels[f]}
                </dt>
                <dd className="text-right text-base font-medium text-slate-800">
                  {card[f]}
                </dd>
              </div>
            ))}
            {card.notes ? (
              <p className="pt-2 text-xs italic text-slate-500">{card.notes}</p>
            ) : null}
          </dl>
        ) : (
          <p className="mt-10 text-center text-sm text-slate-400">
            Tap to reveal · swipe to answer
          </p>
        )}

        <motion.div
          style={{ opacity: overlayLeft }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-red-500/10 ring-2 ring-red-500"
        >
          <span className="absolute left-4 top-4 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
            FORGOT
          </span>
        </motion.div>
        <motion.div
          style={{ opacity: overlayRight }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500"
        >
          <span className="absolute right-4 top-4 rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
            REMEMBER
          </span>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}
