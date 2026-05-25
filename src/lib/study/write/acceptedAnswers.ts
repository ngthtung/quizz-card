import type { WriteQuestion } from '@/types';

// Japanese-script fields are different renderings of the same word:
// mainText (kanji) ↔ variant2 (hiragana) ↔ variant3 (katakana).
// When the question asks for any one of these, accept any of the others.
// Romaji (variant1) and meaning stay strict — typing romaji when asked
// for kanji defeats the production exercise.
const JA_SCRIPT_FIELDS = ['mainText', 'variant2', 'variant3'] as const;

export function acceptedAnswersFor(
  question: WriteQuestion,
  isJapanese: boolean,
): string[] {
  const primary = question.card[question.answerField];
  if (
    !isJapanese ||
    !(JA_SCRIPT_FIELDS as readonly string[]).includes(question.answerField)
  ) {
    return [primary];
  }
  const accepted: string[] = [];
  for (const f of JA_SCRIPT_FIELDS) {
    const v = question.card[f];
    if (v) accepted.push(v);
  }
  return accepted;
}
