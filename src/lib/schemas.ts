import { z } from 'zod';
import {
  DEFAULT_GENERIC_LABELS,
  FIELD_KEYS,
  type CardFormValues,
  type FieldLabels,
  type LanguageFormValues,
} from '@/types';

const labelsSchema = z.object({
  mainText: z.string().min(1, 'Required'),
  variant1: z.string().min(1, 'Required'),
  variant2: z.string().min(1, 'Required'),
  variant3: z.string().min(1, 'Required'),
  meaning: z.string().min(1, 'Required'),
}) satisfies z.ZodType<FieldLabels>;

export const languageFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  fieldLabels: labelsSchema,
}) satisfies z.ZodType<LanguageFormValues>;

export const defaultLanguageFormValues: LanguageFormValues = {
  name: '',
  fieldLabels: { ...DEFAULT_GENERIC_LABELS },
};

export const cardFormSchema = z
  .object({
    languageId: z.string().min(1, 'Language is required'),
    mainText: z.string(),
    variant1: z.string(),
    variant2: z.string(),
    variant3: z.string(),
    meaning: z.string(),
    notes: z.string(),
    tagsRaw: z.string(),
  })
  .refine(
    (v) =>
      [v.mainText, v.variant1, v.variant2, v.variant3, v.meaning].some((s) =>
        s.trim(),
      ),
    {
      message: 'Fill at least one field',
      path: ['mainText'],
    },
  ) satisfies z.ZodType<CardFormValues>;

export function emptyCardFormValues(languageId: string): CardFormValues {
  return {
    languageId,
    mainText: '',
    variant1: '',
    variant2: '',
    variant3: '',
    meaning: '',
    notes: '',
    tagsRaw: '',
  };
}

// Used by import validator so the "at least one field" rule lives in one place.
export function hasAtLeastOneField(card: {
  mainText?: string;
  variant1?: string;
  variant2?: string;
  variant3?: string;
  meaning?: string;
}): boolean {
  return FIELD_KEYS.some((k) => (card[k] ?? '').trim().length > 0);
}
