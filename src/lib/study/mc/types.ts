import type { FieldKey, Flashcard } from '@/types';

export type Question = {
  card: Flashcard;
  questionField: FieldKey;
  answerField: FieldKey;
  choices: string[];
  // Card for each choice — used so Furigana can show the right reading on
  // mainText distractors. `null` when the choice isn't a mainText value.
  choiceCards: (Flashcard | null)[];
  correctIndex: number;
};
