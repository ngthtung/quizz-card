import type { FieldLabels } from './fields';

export type Language = {
  id: string;
  name: string;
  fieldLabels: FieldLabels;
  createdAt: string;
  updatedAt: string;
};

export type CreateLanguageInput = {
  name: string;
  fieldLabels?: Partial<FieldLabels>;
};
