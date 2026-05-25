import { useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { nonEmptyFields } from '@/lib/study';
import type { FieldKey, Flashcard, Language } from '@/types';

const SWIPE_THRESHOLD = 110;

export function SwipeCard({
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
