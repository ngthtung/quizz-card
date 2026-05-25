import { useEffect, useRef, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { recordReview } from '@/db/flashcards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAnswerCorrect } from '@/lib/answerMatch';
import { cn } from '@/lib/utils';
import type { Language, WriteQuestion } from '@/types';
import { acceptedAnswersFor } from '@/lib/study/write/acceptedAnswers';
import { WritePrompt } from './WritePrompt';
import { WriteResult } from './WriteResult';

export function WriteForm({
  question,
  language,
  isJapanese,
  onNext,
}: {
  question: WriteQuestion;
  language: Language;
  isJapanese: boolean;
  onNext: (remembered: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [submittedInput, setSubmittedInput] = useState('');
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (result === null) inputRef.current?.focus();
  }, [result]);

  useEffect(() => {
    if (result !== null) nextRef.current?.focus();
  }, [result]);

  async function submit() {
    if (result !== null) return;
    const accepted = acceptedAnswersFor(question, isJapanese);
    const correct = isAnswerCorrect(input, accepted);
    setSubmittedInput(input);
    setResult(correct ? 'correct' : 'incorrect');
    await recordReview(question.card.id, correct);
  }

  async function skip() {
    if (result !== null) return;
    setSubmittedInput('');
    setResult('incorrect');
    await recordReview(question.card.id, false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    // Don't submit while the IME is composing — Enter is committing the
    // candidate, not the answer.
    if (isComposingRef.current || e.nativeEvent.isComposing) return;
    e.preventDefault();
    void submit();
  }

  const answerIsMeaning = question.answerField === 'meaning';

  return (
    <>
      <WritePrompt
        question={question}
        language={language}
        isJapanese={isJapanese}
      />

      <div className="mt-4">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          disabled={result !== null}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder={
            answerIsMeaning ? 'Your answer…' : 'Your answer (IME ok)…'
          }
          className={cn(
            'h-12 text-lg',
            result === 'correct' &&
              'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
            result === 'incorrect' &&
              'border-destructive bg-destructive/10 ring-2 ring-destructive/30',
          )}
        />
      </div>

      {result === null ? (
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={skip}
          >
            <SkipForward />
            Skip
          </Button>
          <Button size="lg" className="flex-1" onClick={submit}>
            Submit
          </Button>
        </div>
      ) : (
        <WriteResult
          ref={nextRef}
          question={question}
          language={language}
          isJapanese={isJapanese}
          result={result}
          submittedInput={submittedInput}
          onNext={() => onNext(result === 'correct')}
        />
      )}
    </>
  );
}
