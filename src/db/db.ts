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

    this.version(2)
      .stores({
        languages: 'id, name, createdAt',
        flashcards: 'id, languageId, createdAt, lastReviewedAt, *tags',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Flashcard>('flashcards')
          .toCollection()
          .modify((card) => {
            if (card.meaning === undefined) {
              card.meaning = card.notes ?? '';
              card.notes = undefined;
            }
          });
        await tx
          .table<Language>('languages')
          .toCollection()
          .modify((lang) => {
            if (!lang.fieldLabels.meaning) {
              lang.fieldLabels.meaning = 'Meaning';
            }
          });
      });
  }
}

export const db = new QuizzDB();
