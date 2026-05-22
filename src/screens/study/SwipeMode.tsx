import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { nonEmptyFields, pickRandom, pickWeighted } from '@/lib/study';
import { matchesScope, type Scope } from '@/lib/datasets';
import type { FieldKey, Flashcard, Language } from '@/types';

const SWIPE_THRESHOLD = 110;

export function SwipeMode({
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
      <div className="mb-4 space-y-1">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Reviewed {reviewed}</span>
          <span>{cards.length} cards in pool</span>
        </div>
        <Progress value={progress} />
      </div>

      <SwipeCard
        key={current.card.id + current.promptField}
        card={current.card}
        language={language}
        promptField={current.promptField}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onSubmit={submit}
      />

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="lg"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => submit(false)}
        >
          <XCircle />
          Forgot
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? <EyeOff /> : <Eye />}
          {revealed ? 'Hide' : 'Reveal'}
        </Button>
        <Button variant="success" size="lg" onClick={() => submit(true)}>
          <CheckCircle2 />
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

  const isJa = language.name?.toLowerCase() === 'japanese';

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
    <div className="relative h-80 select-none">
      <div
        {...bind()}
        className="absolute inset-0"
        style={{ touchAction: 'pan-y' }}
      >
        <motion.div
          style={{ x, rotate }}
          className="bg-card text-card-foreground absolute inset-0 cursor-grab rounded-2xl border p-6 shadow-lg active:cursor-grabbing"
          onClick={() => !revealed && onReveal()}
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {language.fieldLabels[promptField]}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-3xl font-semibold break-words">
              <Furigana
                text={card[promptField]}
                enabled={isJa && promptField === 'mainText'}
              />
            </p>
            {promptField !== 'meaning' ? (
              <SpeakButton
                text={card[promptField]}
                pronunciation={
                  promptField === 'mainText'
                    ? pronunciationFor(card, language)
                    : undefined
                }
                languageName={language.name}
                fieldKey={promptField}
                size="sm"
              />
            ) : null}
          </div>

          {revealed ? (
            <dl className="border-border mt-6 space-y-2 border-t pt-4">
              {otherFields.map((f) => (
                <div
                  key={f}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="text-muted-foreground text-xs">
                    {language.fieldLabels[f]}
                  </dt>
                  <dd className="text-right text-base font-medium">
                    <Furigana
                      text={card[f]}
                      enabled={isJa && f === 'mainText'}
                    />
                  </dd>
                </div>
              ))}
              {card.notes ? (
                <p className="text-muted-foreground pt-2 text-xs italic">
                  {card.notes}
                </p>
              ) : null}
            </dl>
          ) : (
            <p className="text-muted-foreground mt-10 text-center text-sm">
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
