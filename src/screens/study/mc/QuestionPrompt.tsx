import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import type { Language } from '@/types';
import type { Question } from '@/lib/study/mc/types';

export function QuestionPrompt({
  question,
  language,
  isJa,
}: {
  question: Question;
  language: Language;
  isJa: boolean;
}) {
  return (
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
  );
}
