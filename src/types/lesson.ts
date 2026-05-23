import type { ImportRow } from './import';

export type Lesson = {
  id: string;
  title: string;
  rows: ImportRow[];
};
