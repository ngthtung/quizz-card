import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import type { Language, WriteQuestion } from '@/types';

export function WritePrompt({
  question,
  language,
  isJapanese,
}: {
  question: WriteQuestion;
  language: Language;
  isJapanese: boolean;
}) {
  const promptValue = question.card[question.promptField];
  const promptIsMeaning = question.promptField === 'meaning';

  return (
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
  );
}
