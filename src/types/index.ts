export type FieldKey =
  | 'mainText'
  | 'variant1'
  | 'variant2'
  | 'variant3'
  | 'meaning';

export type FieldLabels = Record<FieldKey, string>;

export type Language = {
  id: string;
  name: string;
  fieldLabels: FieldLabels;
  createdAt: string;
  updatedAt: string;
};

export type Flashcard = {
  id: string;
  languageId: string;
  mainText: string;
  variant1: string;
  variant2: string;
  variant3: string;
  meaning: string;
  notes?: string;
  tags: string[];
  rememberedCount: number;
  forgottenCount: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const FIELD_KEYS: FieldKey[] = [
  'mainText',
  'variant1',
  'variant2',
  'variant3',
  'meaning',
];

export const DEFAULT_GENERIC_LABELS: FieldLabels = {
  mainText: 'Main text',
  variant1: 'Variant 1',
  variant2: 'Variant 2',
  variant3: 'Variant 3',
  meaning: 'Meaning',
};

export const JAPANESE_LABELS: FieldLabels = {
  mainText: 'Kanji',
  variant1: 'Romaji',
  variant2: 'Hiragana',
  variant3: 'Katakana',
  meaning: 'Meaning',
};
