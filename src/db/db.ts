import Dexie, { type EntityTable } from 'dexie';
import type { Flashcard, Language } from '../types';

export class QuizzDB extends Dexie {
  languages!: EntityTable<Language, 'id'>;
  flashcards!: EntityTable<Flashcard, 'id'>;

  constructor() {
    super('quizz-card');
    this.version(1).stores({
      languages: 'id, name, createdAt',
      flashcards: 'id, languageId, createdAt, lastReviewedAt, *tags',
    });
  }
}

export const db = new QuizzDB();
