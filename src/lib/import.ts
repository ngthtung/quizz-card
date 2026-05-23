import { db } from '../db/db';
import { createFlashcard } from '../db/flashcards';
import { createLanguage } from '../db/languages';
import { JAPANESE_LABELS, type ImportResult, type ImportRow } from '../types';
import { parseCsv } from './csv';
import { looksLikeRomaji, romajiToHiragana } from './kana';
import { hasAtLeastOneField } from './schemas';

export async function importRows(rows: ImportRow[]): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    errors: [],
    createdLanguages: [],
  };

  const existing = await db.languages.toArray();
  const byName = new Map<string, string>();
  for (const l of existing) byName.set(l.name.toLowerCase(), l.id);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNo = i + 1;
    try {
      const langName = (row.language ?? '').trim();
      if (!langName) throw new Error('language is required');
      if (!hasAtLeastOneField(row)) {
        throw new Error('at least one field is required');
      }

      let languageId = byName.get(langName.toLowerCase());
      if (!languageId) {
        const isJapanese = langName.toLowerCase() === 'japanese';
        const lang = await createLanguage({
          name: langName,
          fieldLabels: isJapanese ? JAPANESE_LABELS : undefined,
        });
        languageId = lang.id;
        byName.set(langName.toLowerCase(), languageId);
        result.createdLanguages.push(langName);
      }

      const tags = Array.isArray(row.tags)
        ? row.tags.map((t) => t.trim()).filter(Boolean)
        : (row.tags ?? '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

      const isJapanese = langName.toLowerCase() === 'japanese';
      const variant1 = row.variant1 ?? '';
      let variant2 = row.variant2 ?? '';
      if (isJapanese && !variant2.trim() && looksLikeRomaji(variant1)) {
        variant2 = romajiToHiragana(variant1);
      }

      await createFlashcard({
        languageId,
        mainText: row.mainText ?? '',
        variant1,
        variant2,
        variant3: row.variant3 ?? '',
        meaning: row.meaning ?? '',
        notes: row.notes,
        tags,
      });
      result.imported++;
    } catch (e) {
      result.errors.push({
        row: lineNo,
        message: e instanceof Error ? e.message : 'unknown error',
      });
    }
  }

  return result;
}

export function rowsFromCsv(text: string): ImportRow[] {
  return parseCsv(text) as ImportRow[];
}

export function rowsFromJson(text: string): ImportRow[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON must be an array of rows');
  return data as ImportRow[];
}
