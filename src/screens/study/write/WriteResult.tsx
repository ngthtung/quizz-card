import { forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { cn } from '@/lib/utils';
import type { Language, WriteQuestion } from '@/types';

type Props = {
  question: WriteQuestion;
  language: Language;
  isJapanese: boolean;
  result: 'correct' | 'incorrect';
  submittedInput: string;
  onNext: () => void;
};

export const WriteResult = forwardRef<HTMLButtonElement, Props>(
  function WriteResult(
    { question, language, isJapanese, result, submittedInput, onNext },
    nextRef,
  ) {
    const expected = question.card[question.answerField];
    const answerIsMeaning = question.answerField === 'meaning';

    return (
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
              result === 'correct' ? 'text-emerald-700' : 'text-destructive',
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
        <Button ref={nextRef} size="lg" className="w-full" onClick={onNext}>
          Next question
          <ArrowRight />
        </Button>
      </div>
    );
  },
);
