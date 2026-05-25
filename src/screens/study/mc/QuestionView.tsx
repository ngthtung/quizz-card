import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/types';
import { QuestionPrompt } from './QuestionPrompt';
import { ChoiceList } from './ChoiceList';
import type { Question } from '@/lib/study/mc/types';

export function QuestionView({
  question,
  language,
  picked,
  onPick,
  onNext,
}: {
  question: Question;
  language: Language;
  picked: number | null;
  onPick: (i: number) => void;
  onNext: () => void;
}) {
  const isJa = language.name?.toLowerCase() === 'japanese';

  return (
    <>
      <QuestionPrompt question={question} language={language} isJa={isJa} />
      <ChoiceList
        question={question}
        language={language}
        isJa={isJa}
        picked={picked}
        onPick={onPick}
      />

      {picked !== null ? (
        <div className="mt-5 space-y-3">
          {question.card.meaning && (
            <div className="bg-muted/50 rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Meaning
              </p>
              <p className="mt-1 text-sm font-medium">
                {question.card.meaning}
              </p>
            </div>
          )}
          <Button size="lg" className="w-full" onClick={onNext}>
            Next question
            <ArrowRight />
          </Button>
        </div>
      ) : null}
    </>
  );
}
