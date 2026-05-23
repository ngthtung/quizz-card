import type { FieldKey } from './fields';
import type { Flashcard } from './flashcard';

export type WriteQuestion = {
  card: Flashcard;
  promptField: FieldKey;
  answerField: FieldKey;
};

export type ListenQuestion = {
  card: Flashcard;
  spokenText: string;
  choices: string[];
  choiceCards: Flashcard[];
  correctIndex: number;
};
