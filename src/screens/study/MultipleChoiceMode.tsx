import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../../db/db';
import { recordReview } from '../../db/flashcards';
import { Button } from '../../components/Button';
import {
  nonEmptyFields,
  pickRandom,
  pickWeighted,
  shuffle,
} from '../../lib/study';
import type { FieldKey, Flashcard } from '../../types';

type Question = {
  card: Flashcard;
  questionField: FieldKey;
  answerField: FieldKey;
  choices: string[];
  correctIndex: number;
};

export function MultipleChoiceMode({ languageId }: { languageId: string }) {
  const language = useLiveQuery(
    () => db.languages.get(languageId),
    [languageId],
  );
  const cards = useLiveQuery(
    () => db.flashcards.where('languageId').equals(languageId).toArray(),
    [languageId],
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

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
      .toArray();
    setQuestion(buildQuestion(fresh));
    setPicked(null);
  }

  if (!cards || !language) {
    return <div className="px-4 py-6 text-slate-600">Loading…</div>;
  }
  if (cards.length === 0) {
    return (
      <div className="px-4 py-6 text-slate-600">
        No cards in this language yet.
      </div>
    );
  }
  if (!question) {
    return (
      <div className="px-4 py-6 text-slate-600">
        Need at least one card with two filled fields.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {language.fieldLabels[question.questionField]}
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900 break-words">
          {question.card[question.questionField]}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          What is the {language.fieldLabels[question.answerField]}?
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {question.choices.map((c, i) => {
          const isPicked = picked === i;
          const isCorrect = i === question.correctIndex;
          let cls = 'border-slate-200 bg-white hover:border-slate-300';
          if (picked !== null) {
            if (isCorrect) cls = 'border-emerald-500 bg-emerald-50';
            else if (isPicked) cls = 'border-red-500 bg-red-50';
            else cls = 'border-slate-200 bg-white opacity-60';
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              disabled={picked !== null}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition ${cls}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 break-words">{c}</span>
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <Button className="mt-5 w-full py-3 text-base" onClick={onNext}>
          Next question
        </Button>
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
  const distractorPool = cards
    .filter((c) => c.id !== card.id && c[answerField])
    .map((c) => c[answerField] as string)
    .filter((v) => v !== correct);

  const distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);
  const allChoices = shuffle([correct, ...distractors]);
  const correctIndex = allChoices.indexOf(correct);

  return {
    card,
    questionField,
    answerField,
    choices: allChoices,
    correctIndex,
  };
}
