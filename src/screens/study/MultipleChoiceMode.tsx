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
import { nonEmptyFields, pickRandom, pickWeighted, shuffle } from '@/lib/study';
import { matchesScope, type Scope } from '@/lib/datasets';
import { cn } from '@/lib/utils';
import type { FieldKey, Flashcard } from '@/types';

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
        Need at least one card with two filled fields.
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
              <span className="flex-1 wrap-break-word">
                <Furigana
                  text={c}
                  card={question.choiceCards[i] || undefined}
                  enabled={isJa && question.answerField === 'mainText'}
                />
              </span>
              {picked !== null && question.answerField !== 'meaning' ? (
                <SpeakButton
                  text={c}
                  languageName={language.name}
                  fieldKey={question.answerField}
                  size="sm"
                />
              ) : null}
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

function buildQuestion(cards: Flashcard[]): Question | null {
  const card = pickWeighted(cards);
  if (!card) return null;

  const fields = nonEmptyFields(card);
  if (fields.length < 2) return null;

  const questionField = pickRandom(fields);
  const answerCandidates = fields.filter((f) => f !== questionField);
  const answerField = pickRandom(answerCandidates);

  const correct = card[answerField];

  // Build distractor pool with card references
  const distractorCardsPool = cards
    .filter((c) => c.id !== card.id && c[answerField])
    .filter((c) => c[answerField] !== correct);

  const distractorCards = shuffle(distractorCardsPool).slice(0, 3);
  const distractors = distractorCards.map((c) => c[answerField] as string);

  // Create choices with corresponding cards
  const choicesWithCards: Array<{ text: string; card: Flashcard | null }> = [
    { text: correct, card },
    ...distractors.map((text, idx) => ({
      text,
      card: answerField === 'mainText' ? distractorCards[idx] : null
    })),
  ];

  // Shuffle everything together
  const shuffled = shuffle(choicesWithCards);
  const allChoices = shuffled.map((c) => c.text);
  const choiceCards = shuffled.map((c) => c.card);
  const correctIndex = allChoices.indexOf(correct);

  return { card, questionField, answerField, choices: allChoices, choiceCards, correctIndex };
}
