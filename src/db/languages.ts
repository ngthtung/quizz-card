import { db } from './db';
import { newId, nowIso } from '../lib/id';
import {
  DEFAULT_GENERIC_LABELS,
  JAPANESE_LABELS,
  type FieldLabels,
  type Language,
} from '../types';

export type CreateLanguageInput = {
  name: string;
  fieldLabels?: Partial<FieldLabels>;
};

export async function listLanguages(): Promise<Language[]> {
  return db.languages.orderBy('name').toArray();
}

export async function getLanguage(id: string): Promise<Language | undefined> {
  return db.languages.get(id);
}

export async function createLanguage(
  input: CreateLanguageInput,
): Promise<Language> {
  const now = nowIso();
  const lang: Language = {
    id: newId(),
    name: input.name.trim(),
    fieldLabels: {
      ...DEFAULT_GENERIC_LABELS,
      ...(input.fieldLabels ?? {}),
    },
    createdAt: now,
    updatedAt: now,
  };
  await db.languages.add(lang);
  return lang;
}

export async function updateLanguage(
  id: string,
  patch: Partial<Pick<Language, 'name' | 'fieldLabels'>>,
): Promise<void> {
  await db.languages.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteLanguage(id: string): Promise<void> {
  const cardCount = await db.flashcards.where('languageId').equals(id).count();
  if (cardCount > 0) {
    throw new Error(
      `Cannot delete language: ${cardCount} card(s) still use it. Remove them first.`,
    );
  }
  await db.languages.delete(id);
}

export async function ensureSeedLanguage(): Promise<void> {
  const count = await db.languages.count();
  if (count > 0) return;
  await createLanguage({ name: 'Japanese', fieldLabels: JAPANESE_LABELS });
}
