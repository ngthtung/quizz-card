import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, SkipForward } from 'lucide-react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { buildWriteQuestion, type WriteQuestion } from '@/lib/study';
import { isAnswerCorrect } from '@/lib/answerMatch';
import { matchesScope, type Scope } from '@/lib/datasets';
import { cn } from '@/lib/utils';

export function WriteMode({
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
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [submittedInput, setSubmittedInput] = useState('');
  const [reviewed, setReviewed] = useState(0);
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cards && !question) {
      setQuestion(buildWriteQuestion(cards, { isJapanese }));
    }
  }, [cards, question, isJapanese]);

  useEffect(() => {
    if (question && result === null) inputRef.current?.focus();
  }, [question, result]);

  useEffect(() => {
    if (result !== null) nextRef.current?.focus();
  }, [result]);

  async function submit() {
    if (!question || result !== null) return;
    const accepted = acceptedAnswersFor(question, isJapanese);
    const correct = isAnswerCorrect(input, accepted);
    setSubmittedInput(input);
    setResult(correct ? 'correct' : 'incorrect');
    await recordReview(question.card.id, correct);
  }

  async function skip() {
    if (!question || result !== null) return;
    setSubmittedInput('');
    setResult('incorrect');
    await recordReview(question.card.id, false);
  }

  async function next() {
    if (!cards) return;
    const fresh = await db.flashcards
      .where('languageId')
      .equals(languageId)
      .filter((c) => matchesScope(c, scope))
      .toArray();
    setReviewed((n) => n + 1);
    setQuestion(buildWriteQuestion(fresh, { isJapanese }));
    setInput('');
    setSubmittedInput('');
    setResult(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    if (isComposingRef.current || e.nativeEvent.isComposing) return;
    e.preventDefault();
    void submit();
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

  const expected = question.card[question.answerField];
  const promptValue = question.card[question.promptField];
  const promptIsMeaning = question.promptField === 'meaning';
  const answerIsMeaning = question.answerField === 'meaning';
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

      <div className="bg-card rounded-2xl border p-6 shadow-xs">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {language.fieldLabels[question.promptField]}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-semibold break-words">
            <Furigana
              text={promptValue}
              enabled={isJapanese && question.promptField === 'mainText'}
            />
          </p>
          {!promptIsMeaning ? (
            <SpeakButton
              text={promptValue}
              pronunciation={
                question.promptField === 'mainText'
                  ? pronunciationFor(question.card, language)
                  : undefined
              }
              languageName={language.name}
              size="sm"
            />
          ) : null}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Type the {language.fieldLabels[question.answerField]}.
        </p>
      </div>

      <div className="mt-4">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          disabled={result !== null}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder={
            answerIsMeaning ? 'Your answer…' : 'Your answer (IME ok)…'
          }
          className={cn(
            'h-12 text-lg',
            result === 'correct' &&
              'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
            result === 'incorrect' &&
              'border-destructive bg-destructive/10 ring-2 ring-destructive/30',
          )}
        />
      </div>

      {result === null ? (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={skip}>
            <SkipForward />
            Skip
          </Button>
          <Button size="lg" className="flex-1" onClick={submit}>
            Submit
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div
            className={cn(
              'rounded-xl border p-4',
              result === 'correct'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-destructive/30 bg-destructive/5',
            )}
          >
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                result === 'correct'
                  ? 'text-emerald-700'
                  : 'text-destructive',
              )}
            >
              {result === 'correct' ? 'Correct' : 'Incorrect'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-muted-foreground text-xs">Answer:</p>
              <p className="flex-1 break-words text-base font-medium">
                <Furigana
                  text={expected}
                  enabled={isJapanese && question.answerField === 'mainText'}
                />
              </p>
              {!answerIsMeaning ? (
                <SpeakButton
                  text={expected}
                  pronunciation={
                    question.answerField === 'mainText'
                      ? pronunciationFor(question.card, language)
                      : undefined
                  }
                  languageName={language.name}
                  size="sm"
                />
              ) : null}
            </div>
            {result === 'incorrect' && submittedInput ? (
              <p className="text-muted-foreground mt-2 text-xs">
                You typed:{' '}
                <span className="text-foreground font-medium">
                  {submittedInput}
                </span>
              </p>
            ) : null}
          </div>
          {question.card.meaning && (
            <div className="bg-muted/50 rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Meaning
              </p>
              <p className="mt-1 text-sm font-medium">{question.card.meaning}</p>
            </div>
          )}
          <Button ref={nextRef} size="lg" className="w-full" onClick={next}>
            Next question
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}

// Japanese-script fields are different renderings of the same word:
// mainText (kanji) ↔ variant2 (hiragana) ↔ variant3 (katakana).
// When the question asks for any one of these, accept any of the others.
// Romaji (variant1) and meaning stay strict — typing romaji when asked
// for kanji defeats the production exercise.
const JA_SCRIPT_FIELDS = ['mainText', 'variant2', 'variant3'] as const;

function acceptedAnswersFor(
  question: WriteQuestion,
  isJapanese: boolean,
): string[] {
  const primary = question.card[question.answerField];
  if (
    !isJapanese ||
    !(JA_SCRIPT_FIELDS as readonly string[]).includes(question.answerField)
  ) {
    return [primary];
  }
  const accepted: string[] = [];
  for (const f of JA_SCRIPT_FIELDS) {
    const v = question.card[f];
    if (v) accepted.push(v);
  }
  return accepted;
}
