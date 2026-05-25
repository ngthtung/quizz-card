import { forwardRef } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Furigana } from '@/components/Furigana';
import type { Language, ListenQuestion } from '@/types';

type Props = {
  question: ListenQuestion;
  language: Language;
  onReplay: () => void;
  onNext: () => void;
};

export const ListenReveal = forwardRef<HTMLButtonElement, Props>(
  function ListenReveal({ question, language, onReplay, onNext }, nextRef) {
    const isJa = language.name?.toLowerCase() === 'japanese';

    return (
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
              onClick={onReplay}
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
    );
  },
);
