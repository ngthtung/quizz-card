import { pickWeighted, shuffle } from '@/lib/study';
import type { FieldKey, Flashcard } from '@/types';
import type { Question } from './types';

const SCRIPT_FIELDS: FieldKey[] = ['mainText', 'variant2', 'variant3'];

function pickScriptField(card: Flashcard): FieldKey | null {
  if (card.mainText) return 'mainText';
  if (card.variant2) return 'variant2';
  if (card.variant3) return 'variant3';
  return null;
}

export function isEligible(card: Flashcard): boolean {
  return Boolean(card.meaning) && SCRIPT_FIELDS.some((f) => card[f]);
}

export function buildQuestion(cards: Flashcard[]): Question | null {
  const eligible = cards.filter(isEligible);
  if (eligible.length === 0) return null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const card = pickWeighted(eligible);
    if (!card) return null;
    const built = buildQuestionForCard(card, eligible);
    if (built) return built;
  }
  return null;
}

export function buildQuestionForCard(
  card: Flashcard,
  pool: Flashcard[],
): Question | null {
  if (!isEligible(card)) return null;
  const eligible = pool.filter(isEligible);

  const scriptField = pickScriptField(card);
  if (!scriptField) return null;

  const direction: 'scriptToMeaning' | 'meaningToScript' =
    Math.random() < 0.5 ? 'scriptToMeaning' : 'meaningToScript';

  const questionField: FieldKey =
    direction === 'scriptToMeaning' ? scriptField : 'meaning';
  const answerField: FieldKey =
    direction === 'scriptToMeaning' ? 'meaning' : scriptField;

  const correct = card[answerField];
  if (!correct) return null;

  const distractorPool = eligible.filter(
    (c) => c.id !== card.id && c[answerField] && c[answerField] !== correct,
  );
  const distractorCards = shuffle(distractorPool).slice(0, 3);
  const distractors = distractorCards.map((c) => c[answerField] as string);

  const choicesWithCards: Array<{ text: string; card: Flashcard | null }> = [
    { text: correct, card },
    ...distractors.map((text, idx) => ({
      text,
      card: answerField === 'mainText' ? distractorCards[idx] : null,
    })),
  ];

  const shuffled = shuffle(choicesWithCards);
  const allChoices = shuffled.map((c) => c.text);
  const choiceCards = shuffled.map((c) => c.card);
  const correctIndex = allChoices.indexOf(correct);

  return {
    card,
    questionField,
    answerField,
    choices: allChoices,
    choiceCards,
    correctIndex,
  };
}
