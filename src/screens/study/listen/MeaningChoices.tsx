import { cn } from '@/lib/utils';
import type { ListenQuestion } from '@/types';

export function MeaningChoices({
  question,
  picked,
  onPick,
}: {
  question: ListenQuestion;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  return (
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

        const baseClass = cn(
          'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          cls,
        );

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
            className={baseClass}
          >
            {content}
          </button>
        ) : (
          <div key={i} className={baseClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
