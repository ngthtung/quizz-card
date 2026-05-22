import type { Flashcard } from '@/types';

export type DatasetGroup = 'lessons' | 'kana' | 'other';

export type Dataset = {
  id: string;        // the raw tag, e.g. 'minna-bai-3'
  label: string;     // human-readable, e.g. 'Minna Bài 3'
  count: number;     // cards in the chosen language with this tag
  group: DatasetGroup;
  // For lessons we want numeric sort; for others alphabetical.
  sortKey: number | string;
};

const MINNA_BAI_RE = /^minna-bai-(\d+)$/;

function classify(tag: string): {
  group: DatasetGroup;
  label: string;
  sortKey: number | string;
} {
  const minna = tag.match(MINNA_BAI_RE);
  if (minna) {
    const n = parseInt(minna[1], 10);
    return { group: 'lessons', label: `Minna Bài ${n}`, sortKey: n };
  }
  if (tag === 'kana') {
    return { group: 'kana', label: 'Kana basics', sortKey: 0 };
  }
  return { group: 'other', label: tag, sortKey: tag };
}

export function groupTagsForLanguage(
  languageId: string,
  cards: Flashcard[],
): Dataset[] {
  const counts = new Map<string, number>();
  for (const c of cards) {
    if (c.languageId !== languageId) continue;
    for (const t of c.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const datasets: Dataset[] = [];
  for (const [tag, count] of counts) {
    const meta = classify(tag);
    datasets.push({ id: tag, count, ...meta });
  }

  const groupOrder: Record<DatasetGroup, number> = {
    lessons: 0,
    kana: 1,
    other: 2,
  };
  datasets.sort((a, b) => {
    if (a.group !== b.group) return groupOrder[a.group] - groupOrder[b.group];
    if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
      return a.sortKey - b.sortKey;
    }
    return String(a.sortKey).localeCompare(String(b.sortKey));
  });
  return datasets;
}

// "Everything" is represented as null. Anything else is an explicit tag list.
export type Scope = string[] | null;

export function countCardsForScope(
  scope: Scope,
  languageId: string,
  cards: Flashcard[],
): number {
  return cards.filter((c) => {
    if (c.languageId !== languageId) return false;
    if (scope === null) return true;
    if (scope.length === 0) return false;
    return c.tags.some((t) => scope.includes(t));
  }).length;
}

// First-visit default: most recently imported lesson (largest minna-bai-N).
// Fallbacks: alphabetically-first dataset, then "Everything".
export function defaultScope(datasets: Dataset[]): Scope {
  const lessons = datasets.filter((d) => d.group === 'lessons');
  if (lessons.length > 0) {
    const latest = lessons[lessons.length - 1]; // already sorted asc by N
    return [latest.id];
  }
  if (datasets.length > 0) {
    return [datasets[0].id];
  }
  return null;
}

// localStorage I/O — silently drops tags that no longer exist.
const STORAGE_PREFIX = 'quizz-card.studyScope.';

export function loadSavedScope(
  languageId: string,
  datasets: Dataset[],
): Scope {
  if (typeof localStorage === 'undefined') return defaultScope(datasets);
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_PREFIX + languageId);
  } catch {
    return defaultScope(datasets);
  }
  if (!raw) return defaultScope(datasets);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultScope(datasets);
  }

  if (!parsed || typeof parsed !== 'object') return defaultScope(datasets);
  const tags = (parsed as { tags?: unknown }).tags;
  if (tags === null) return null;
  if (!Array.isArray(tags)) return defaultScope(datasets);

  const valid = new Set(datasets.map((d) => d.id));
  const filtered = tags.filter(
    (t): t is string => typeof t === 'string' && valid.has(t),
  );
  if (filtered.length === 0) return defaultScope(datasets);
  return filtered;
}

export function matchesScope(
  card: Pick<Flashcard, 'tags'>,
  scope: Scope,
): boolean {
  if (scope === null) return true;
  if (scope.length === 0) return false;
  return card.tags.some((t) => scope.includes(t));
}

export function saveScope(languageId: string, scope: Scope): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + languageId,
      JSON.stringify({ tags: scope }),
    );
  } catch {
    /* quota / disabled — ignore */
  }
}
