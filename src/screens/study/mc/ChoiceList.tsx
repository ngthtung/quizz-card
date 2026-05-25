import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';
import type { Question } from '@/lib/study/mc/types';

export function ChoiceList({
  question,
  language,
  isJa,
  picked,
  onPick,
}: {
  question: Question;
  language: Language;
  isJa: boolean;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  const showSpeaker = question.answerField !== 'meaning';

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {question.choices.map((c, i) => {
        const isPicked = picked === i;
        const isCorrect = i === question.correctIndex;
        const isAnswered = picked !== null;
        const cls = !isAnswered
          ? 'bg-card hover:bg-accent border-border cursor-pointer'
          : isCorrect
            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
            : isPicked
              ? 'border-destructive bg-destructive/10 ring-2 ring-destructive'
              : 'bg-card border-border opacity-60';

        const baseClass = cn(
          'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          cls,
        );

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

        if (isAnswered) {
          return (
            <div key={i} className={baseClass}>
              {content}
            </div>
          );
        }

        // The speaker button is itself interactive, so when present we use a
        // div with role="button" instead of a <button> to avoid nested
        // interactive elements (invalid HTML, broken focus).
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
  );
}
