export type DatasetGroup = 'lessons' | 'kana' | 'other';

export type Dataset = {
  id: string;
  label: string;
  count: number;
  group: DatasetGroup;
  sortKey: number | string;
};

// "Everything" is represented as null. Anything else is an explicit tag list.
export type Scope = string[] | null;
