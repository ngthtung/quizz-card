import type { FieldLabels } from './fields';

export type LanguageFormValues = {
  name: string;
  fieldLabels: FieldLabels;
};

export type CardFormValues = {
  languageId: string;
  mainText: string;
  variant1: string;
  variant2: string;
  variant3: string;
  meaning: string;
  notes: string;
  tagsRaw: string;
};
