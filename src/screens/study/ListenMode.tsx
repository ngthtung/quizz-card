import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Furigana } from '@/components/Furigana';
import { cleanForSpeech, speak, speechSupported } from '@/lib/speech';
import { buildListenQuestion } from '@/lib/study';
import { matchesScope } from '@/lib/datasets';
import { cn } from '@/lib/utils';
import type { ListenQuestion, Scope } from '@/types';

export function ListenMode({
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
  const [picked, setPicked] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cards && language && !question) {
      setQuestion(buildListenQuestion(cards, { language }));
    }
  }, [cards, language, question]);

  useEffect(() => {
    if (!question || !language) return;
    const text = cleanForSpeech(question.spokenText);
    if (text) speak(text, language.name);
  }, [question, language]);

  useEffect(() => {
    if (picked !== null) nextRef.current?.focus();
  }, [picked]);

  function replay() {
    if (!question || !language) return;
    const text = cleanForSpeech(question.spokenText);
    if (text) speak(text, language.name);
  }

  async function onPick(index: number) {
    if (!question || picked !== null) return;
    setPicked(index);
    const correct = index === question.correctIndex;
    await recordReview(question.card.id, correct);
  }

  async function onNext() {
    if (!cards || !language) return;
    const fresh = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setQuestion(buildListenQuestion(fresh, { language }));
    setPicked(null);
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

  const isJa = language.name?.toLowerCase() === 'japanese';
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

      <div className="bg-card flex flex-col items-center rounded-2xl border p-8 shadow-xs">
        <Button
          type="button"
          size="icon"
          onClick={replay}
          aria-label="Replay audio"
          title="Replay audio"
          className="h-20 w-20 rounded-full"
        >
          <Volume2 className="size-8" />
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">Tap to replay</p>
        <p className="text-muted-foreground mt-3 text-xs">
          Pick the matching meaning.
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {question.choices.map((c, i) => {
          const isPicked = picked === i;
          const isCorrect = i === question.correctIndex;
          const cls =
            picked === null
              ? 'bg-card hover:bg-accent border-border'
              : isCorrect
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                : isPicked
                  ? 'border-destructive bg-destructive/10 ring-2 ring-destructive'
                  : 'bg-card border-border opacity-60';

          const content = (
            <>
              <span className="bg-muted text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 wrap-break-word">{c}</span>
            </>
          );

          return picked === null ? (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                cls,
              )}
            >
              {content}
            </button>
          ) : (
            <div
              key={i}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base',
                cls,
              )}
            >
              {content}
            </div>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="mt-5 space-y-3" role="status">
          <div className="bg-muted/50 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {language.fieldLabels.mainText}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="flex-1 break-words text-2xl font-semibold">
                <Furigana
                  text={question.card.mainText}
                  card={question.card}
                  enabled={isJa}
                />
              </p>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                onClick={replay}
                aria-label="Replay audio"
                title="Replay audio"
                className="rounded-full"
              >
                <Volume2 className="size-3" />
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs uppercase tracking-wide">
              Meaning
            </p>
            <p className="mt-1 text-sm font-medium">{question.card.meaning}</p>
          </div>
          <Button ref={nextRef} size="lg" className="w-full" onClick={onNext}>
            Next question
            <ArrowRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
