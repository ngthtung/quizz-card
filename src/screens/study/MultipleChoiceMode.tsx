import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { db } from '@/db/db';
import { recordReview } from '@/db/flashcards';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { pickWeighted, shuffle } from '@/lib/study';
import { matchesScope } from '@/lib/datasets';
import { cn } from '@/lib/utils';
import type { FieldKey, Flashcard, Scope } from '@/types';

type Question = {
  card: Flashcard;
  questionField: FieldKey;
  answerField: FieldKey;
  choices: string[];
  choiceCards: (Flashcard | null)[]; // Card for each choice
  correctIndex: number;
};

export function MultipleChoiceMode({
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
        Need at least two cards with a meaning and a kanji/hiragana/katakana field.
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

      <div className="bg-card rounded-2xl border p-6 shadow-xs">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {language.fieldLabels[question.questionField]}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-semibold wrap-break-word">
            <Furigana
              text={question.card[question.questionField]}
              card={question.card}
              enabled={isJa && question.questionField === 'mainText'}
            />
          </p>
          {question.questionField !== 'meaning' ? (
            <SpeakButton
              text={question.card[question.questionField]}
              pronunciation={
                question.questionField === 'mainText'
                  ? pronunciationFor(question.card, language)
                  : undefined
              }
              languageName={language.name}
              fieldKey={question.questionField}
              size="sm"
            />
          ) : null}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          What is the {language.fieldLabels[question.answerField]}?
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {question.choices.map((c, i) => {
          const isPicked = picked === i;
          const isCorrect = i === question.correctIndex;
          const isAnswered = picked !== null;
          const showSpeaker = question.answerField !== 'meaning';
          const cls =
            !isAnswered
              ? 'bg-card hover:bg-accent border-border cursor-pointer'
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
              <span className="flex-1 wrap-break-word">
                <Furigana
                  text={c}
                  card={question.choiceCards[i] || undefined}
                  enabled={isJa && question.answerField === 'mainText'}
                />
              </span>
              {showSpeaker ? (
                <SpeakButton
                  text={c}
                  languageName={language.name}
                  fieldKey={question.answerField}
                  size="sm"
                />
              ) : null}
            </>
          );

          const baseClass = cn(
            'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            cls,
          );

          if (isAnswered) {
            return (
              <div key={i} className={baseClass}>
                {content}
              </div>
            );
          }

          if (showSpeaker) {
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => onPick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPick(i);
                  }
                }}
                className={baseClass}
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className={baseClass}
            >
              {content}
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="mt-5 space-y-3">
          {question.card.meaning && (
            <div className="bg-muted/50 rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Meaning
              </p>
              <p className="mt-1 text-sm font-medium">{question.card.meaning}</p>
            </div>
          )}
          <Button size="lg" className="w-full" onClick={onNext}>
            Next question
            <ArrowRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const SCRIPT_FIELDS: FieldKey[] = ['mainText', 'variant2', 'variant3'];

function pickScriptField(card: Flashcard): FieldKey | null {
  if (card.mainText) return 'mainText';
  if (card.variant2) return 'variant2';
  if (card.variant3) return 'variant3';
  return null;
}

function isEligible(card: Flashcard): boolean {
  return Boolean(card.meaning) && SCRIPT_FIELDS.some((f) => card[f]);
}

function buildQuestion(cards: Flashcard[]): Question | null {
  const eligible = cards.filter(isEligible);
  if (eligible.length === 0) return null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const card = pickWeighted(eligible);
    if (!card) return null;

    const scriptField = pickScriptField(card);
    if (!scriptField) continue;

    const direction: 'scriptToMeaning' | 'meaningToScript' =
      Math.random() < 0.5 ? 'scriptToMeaning' : 'meaningToScript';

    const questionField: FieldKey =
      direction === 'scriptToMeaning' ? scriptField : 'meaning';
    const answerField: FieldKey =
      direction === 'scriptToMeaning' ? 'meaning' : scriptField;

    const correct = card[answerField];
    if (!correct) continue;

    const distractorPool = eligible.filter(
      (c) => c.id !== card.id && c[answerField] && c[answerField] !== correct,
    );
    const distractorCards = shuffle(distractorPool).slice(0, 3);
    const distractors = distractorCards.map((c) => c[answerField] as string);

    const choicesWithCards: Array<{ text: string; card: Flashcard | null }> = [
      { text: correct, card },
      ...distractors.map((text, idx) => ({
        text,
        card: answerField === 'mainText' ? distractorCards[idx] : null,
      })),
    ];

    const shuffled = shuffle(choicesWithCards);
    const allChoices = shuffled.map((c) => c.text);
    const choiceCards = shuffled.map((c) => c.card);
    const correctIndex = allChoices.indexOf(correct);

    return {
      card,
      questionField,
      answerField,
      choices: allChoices,
      choiceCards,
      correctIndex,
    };
  }
  return null;
}
